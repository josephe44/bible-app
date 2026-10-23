import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

const AnimatedLine = Animated.createAnimatedComponent(Line);

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Where the little man can stand, in the header's own coordinate space. */
export interface RunnerAnchors {
  caption: Rect;
  title: Rect;
  badge: Rect;
}

interface Segment {
  kind: 0 | 1; // 0 = run along a surface, 1 = jump between surfaces
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  dur: number; // seconds
  rise: number; // extra apex height of a jump
  t0: number; // start time within the whole path
}

// Sprite space: 40 x 54 units, centred on x = 20, feet on y = 52. Drawn at SCALE points per unit.
const W = 40;
const H = 54;
const FEET_Y = 52;
const SCALE = 0.55;

// Bone lengths (sprite units)
const THIGH = 11;
const SHIN = 11;
const TORSO = 14;
const UPPER_ARM = 8;
const FOREARM = 7.5;

const RUN_SPEED = 62; // points per second
const CADENCE = 10.5; // run-cycle radians per second
const RESUME_DELAY = 0.9; // seconds he stays standing after a touch ends

function buildPath(a: RunnerAnchors): { segs: Segment[]; total: number } {
  const capY = a.caption.y + 2;
  const titleY = a.title.y + 2;
  const badgeY = a.badge.y;

  const capX0 = a.caption.x + 8;
  const capX1 = a.caption.x + a.caption.w - 2;
  const titleX0 = capX1 + 14; // starts beyond the caption so he never covers it
  const titleX1 = Math.max(a.title.x + a.title.w - 8, titleX0 + 24);
  const badgeX0 = a.badge.x + 14;
  const badgeX1 = a.badge.x + a.badge.w - 14;

  const run = (x0: number, x1: number, y: number): Omit<Segment, 't0'> => ({
    kind: 0,
    x0,
    y0: y,
    x1,
    y1: y,
    dur: Math.max(0.25, Math.abs(x1 - x0) / RUN_SPEED),
    rise: 0,
  });
  const jump = (x0: number, y0: number, x1: number, y1: number, rise: number): Omit<Segment, 't0'> => {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    return {
      kind: 1,
      x0,
      y0,
      x1,
      y1,
      dur: Math.min(0.9, Math.max(0.45, dist / 140)),
      rise,
    };
  };

  const raw = [
    run(capX0, capX1, capY),
    jump(capX1, capY, titleX0, titleY, 10),
    run(titleX0, titleX1, titleY),
    jump(titleX1, titleY, badgeX0, badgeY, 24),
    run(badgeX0, badgeX1, badgeY),
  ];

  let t = 0;
  const segs = raw.map((s) => {
    const seg = { ...s, t0: t };
    t += s.dur;
    return seg;
  });
  return { segs, total: t };
}

interface RunningManProps {
  anchors: RunnerAnchors | null;
  /** True while a finger is on the screen; he stops and stands up straight. */
  touching: SharedValue<boolean>;
}

// Indices into the pose array: each point is an (x, y) pair in sprite units
const HIP = 0;
const SHOULDER = 1;
const HEAD = 2;
const N_KNEE = 3;
const N_FOOT = 4;
const F_KNEE = 5;
const F_FOOT = 6;
const N_ELBOW = 7;
const N_HAND = 8;
const F_ELBOW = 9;
const F_HAND = 10;
const SCARF = 11;
const N_TOE = 12;
const F_TOE = 13;

/**
 * Joint positions for the run cycle, standing pose and jump pose, blended.
 * Bones are posed by angle (forward kinematics) and the hip is placed so the
 * lowest foot always meets the ground, which gives the body its natural bounce.
 */
function computePose(phase: number, r: number, air: number): number[] {
  'worklet';
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // side 0 = near (drawn in front), side 1 = far
  const leg = (side: number) => {
    const p = phase + side * Math.PI;
    const a = lerp(
      lerp(side === 0 ? 0.05 : -0.05, 0.15 + 0.82 * Math.sin(p), r),
      side === 0 ? 1.05 : -0.55,
      air
    ); // thigh angle, forward positive
    const k = lerp(
      lerp(0.02, 0.28 + 1.05 * Math.max(0, Math.cos(p)), r),
      side === 0 ? 1.35 : 0.7,
      air
    ); // knee bend: the shin folds back
    const kx = THIGH * Math.sin(a);
    const ky = THIGH * Math.cos(a);
    const fx = kx + SHIN * Math.sin(a - k);
    const fy = ky + SHIN * Math.cos(a - k);
    return { kx, ky, fx, fy };
  };
  const near = leg(0);
  const far = leg(1);

  const hipX = W / 2;
  const hipY = FEET_Y - Math.max(near.fy, far.fy); // lowest foot touches the ground

  const lean = 0.24 * r * (1 - air) + 0.1 * air;
  const shX = hipX + TORSO * Math.sin(lean);
  const shY = hipY - TORSO * Math.cos(lean);
  const headX = shX + 8.5 * Math.sin(lean * 1.15);
  const headY = shY - 8.5 * Math.cos(lean * 1.15);

  const arm = (side: number) => {
    const p = phase + side * Math.PI + Math.PI; // swings against the same-side leg
    const upper = lerp(
      lerp(side === 0 ? 0.08 : -0.08, 0.1 + 0.95 * Math.sin(p), r),
      side === 0 ? 2.7 : 2.3,
      air
    );
    const fore = lerp(lerp(upper + 0.12, upper + 1.45, r), upper + 0.2, air);
    const ex = shX + UPPER_ARM * Math.sin(upper);
    const ey = shY + 1.5 + UPPER_ARM * Math.cos(upper);
    const hx = ex + FOREARM * Math.sin(fore);
    const hy = ey + FOREARM * Math.cos(fore);
    return { ex, ey, hx, hy };
  };
  const nearArm = arm(0);
  const farArm = arm(1);

  const flap = Math.sin(phase * 2) * 1.6 * r;
  const scarfX = shX - 7 * r - 1;
  const scarfY = shY + 1.5 + flap;

  return [
    hipX, hipY,
    shX, shY,
    headX, headY,
    hipX + near.kx, hipY + near.ky,
    hipX + near.fx, hipY + near.fy,
    hipX + far.kx, hipY + far.ky,
    hipX + far.fx, hipY + far.fy,
    nearArm.ex, nearArm.ey,
    nearArm.hx, nearArm.hy,
    farArm.ex, farArm.ey,
    farArm.hx, farArm.hy,
    scarfX, scarfY,
    hipX + near.fx + 4.5, hipY + near.fy + 0.4,
    hipX + far.fx + 4.5, hipY + far.fy + 0.4,
  ];
}

interface SegProps {
  pose: SharedValue<number[]>;
  from: number;
  to: number;
  color: string;
  width: number;
}

/** One limb segment, redrawn from the shared pose every frame. */
function Seg({ pose, from, to, color, width }: SegProps) {
  'use no memo';
  const props = useAnimatedProps(() => ({
    x1: pose.value[from * 2],
    y1: pose.value[from * 2 + 1],
    x2: pose.value[to * 2],
    y2: pose.value[to * 2 + 1],
  }));
  return <AnimatedLine animatedProps={props} stroke={color} strokeWidth={width} strokeLinecap="round" />;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function Dot({
  pose,
  at,
  dx,
  dy,
  r,
  color,
}: {
  pose: SharedValue<number[]>;
  at: number;
  dx: number;
  dy: number;
  r: number;
  color: string;
}) {
  'use no memo';
  const props = useAnimatedProps(() => ({
    cx: pose.value[at * 2] + dx,
    cy: pose.value[at * 2 + 1] + dy,
  }));
  return <AnimatedCircle animatedProps={props} r={r} fill={color} />;
}

// Palette: near side in full colour, far side a shade darker for depth
const SKIN = '#EBB98C';
const SKIN_FAR = '#C99768';
const HAIR = '#3A2415';

/**
 * A little man who runs along the Today header: across the "Day x of y" line,
 * down onto the "Today's Word" title, and up onto the streak badge, then back
 * again, forever. A touch makes him stop and stand straight.
 */
export function RunningMan({ anchors, touching }: RunningManProps) {
  'use no memo'; // worklets read shared values directly; keep the compiler out
  const theme = useTheme();
  const reducedMotion = useReducedMotion();

  const segs = useSharedValue<Segment[]>([]);
  const total = useSharedValue(0);
  const tau = useSharedValue(0); // time along the path
  const dir = useSharedValue(1); // +1 forwards, -1 back
  const hold = useSharedValue(0); // remaining stand-still time after a touch
  const phase = useSharedValue(0); // run-cycle phase
  const runAmt = useSharedValue(0); // 0 = standing, 1 = full stride
  const air = useSharedValue(0); // 0 = on the ground, 1 = mid-jump pose
  const px = useSharedValue(-100);
  const py = useSharedValue(-100);
  const reduced = useSharedValue(false);

  useEffect(() => {
    reduced.value = reducedMotion;
  }, [reducedMotion, reduced]);

  useEffect(() => {
    if (!anchors) return;
    const path = buildPath(anchors);
    segs.value = path.segs;
    total.value = path.total;
    tau.value = 0;
    dir.value = 1;
  }, [anchors, segs, total, tau, dir]);

  const frame = useFrameCallback((info) => {
    'worklet';
    const list = segs.value;
    if (list.length === 0) return;
    const dt = Math.min((info.timeSincePreviousFrame ?? 16) / 1000, 0.05);

    const find = (t: number) => {
      let idx = 0;
      for (let i = 0; i < list.length; i++) {
        if (t >= list[i].t0) idx = i;
      }
      return list[idx];
    };

    // A touch (or reduced-motion) keeps him standing; he waits a beat after release
    if (touching.value || reduced.value) {
      hold.value = RESUME_DELAY;
    } else {
      hold.value = Math.max(0, hold.value - dt);
    }
    const wantStop = hold.value > 0;

    // He never freezes mid-air: finish the jump first, then stand
    const before = find(tau.value);
    const stopped = wantStop && before.kind === 0;

    if (!stopped) {
      let t = tau.value + dir.value * dt;
      if (t >= total.value) {
        t = total.value;
        dir.value = -1;
      } else if (t <= 0) {
        t = 0;
        dir.value = 1;
      }
      tau.value = t;
    }

    const seg = find(tau.value);
    const u = Math.min(1, Math.max(0, (tau.value - seg.t0) / seg.dur));
    px.value = seg.x0 + (seg.x1 - seg.x0) * u;
    py.value = seg.y0 + (seg.y1 - seg.y0) * u - (seg.kind === 1 ? 4 * seg.rise * u * (1 - u) : 0);

    const running = !stopped && seg.kind === 0;
    const k = Math.min(1, dt * 12);
    runAmt.value += ((running ? 1 : 0) - runAmt.value) * k;
    air.value += ((seg.kind === 1 ? 1 : 0) - air.value) * k;
    if (running) phase.value += dt * CADENCE;
  }, false);

  // Only animate while the Today tab is on screen
  useFocusEffect(
    React.useCallback(() => {
      frame.setActive(true);
      return () => frame.setActive(false);
    }, [frame])
  );

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: px.value - (W * SCALE) / 2 },
      { translateY: py.value - FEET_Y * SCALE },
      { scaleX: dir.value },
    ],
  }));

  const pose = useDerivedValue(() => computePose(phase.value, runAmt.value, air.value));

  const shirt = theme.primary;
  const shirtFar = Colors.primaryDark;
  const shorts = Colors.accent;
  const shortsFar = Colors.accentDark;
  const shoe = theme.textPrimary;

  return (
    <Animated.View pointerEvents="none" style={[styles.wrapper, wrapperStyle]}>
      <Svg width={W * SCALE} height={H * SCALE} viewBox={`0 0 ${W} ${H}`}>
        {/* far side first */}
        <Seg pose={pose} from={SHOULDER} to={F_ELBOW} color={shirtFar} width={3.8} />
        <Seg pose={pose} from={F_ELBOW} to={F_HAND} color={SKIN_FAR} width={3.1} />
        <Seg pose={pose} from={HIP} to={F_KNEE} color={shortsFar} width={5.4} />
        <Seg pose={pose} from={F_KNEE} to={F_FOOT} color={SKIN_FAR} width={4} />
        <Seg pose={pose} from={F_FOOT} to={F_TOE} color={shoe} width={3.6} />

        {/* torso, scarf, head */}
        <Seg pose={pose} from={HIP} to={SHOULDER} color={shirt} width={8} />
        <Seg pose={pose} from={SHOULDER} to={SCARF} color={theme.streak} width={2.6} />
        <Dot pose={pose} at={HEAD} dx={-0.9} dy={-0.9} r={5.8} color={HAIR} />
        <Dot pose={pose} at={HEAD} dx={0.9} dy={0.5} r={4.7} color={SKIN} />
        <Dot pose={pose} at={HEAD} dx={2.8} dy={0.1} r={0.85} color={HAIR} />

        {/* near side in front */}
        <Seg pose={pose} from={HIP} to={N_KNEE} color={shorts} width={5.6} />
        <Seg pose={pose} from={N_KNEE} to={N_FOOT} color={SKIN} width={4.2} />
        <Seg pose={pose} from={N_FOOT} to={N_TOE} color={shoe} width={3.8} />
        <Seg pose={pose} from={SHOULDER} to={N_ELBOW} color={shirt} width={4} />
        <Seg pose={pose} from={N_ELBOW} to={N_HAND} color={SKIN} width={3.3} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: W * SCALE,
    height: H * SCALE,
  },
});

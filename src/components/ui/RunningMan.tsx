import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
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

// Behaviours (action kinds) besides running
const SIT = 1;
const STRETCH = 2;
const LOOK = 3;
const WAVE = 4;
const HOP = 5;
const STUMBLE = 6;
const CELEBRATE = 7;
//                  none  sit  stretch look wave  hop  stumble celebrate
const DURATIONS = [0, 3.4, 2.3, 2.6, 1.7, 0.7, 1.6, 3.0];

/** What the screen can ask the little man to do. */
export interface RunnerHandle {
  /** A finger went down at this window position; he reacts if it was on him. */
  touch(pageX: number, pageY: number): void;
  /** The page scrolled to this offset; a hard scroll makes him stumble. */
  scrolled(offsetY: number): void;
  /** The day was just marked read: he races to the badge and celebrates. */
  celebrate(): void;
}

interface RunningManProps {
  anchors: RunnerAnchors | null;
  /** True while a finger is on the screen; he stops and stands up straight. */
  touching: SharedValue<boolean>;
  ref?: React.Ref<RunnerHandle>;
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
 * Joint positions for the run cycle and every other pose, blended by weight.
 * Bones are posed by angle (forward kinematics) and the hip is placed so the
 * lowest foot always meets the ground, which gives the body its natural bounce.
 */
function computePose(
  phase: number,
  r: number, // running
  air: number, // mid-jump / hopping
  sit: number,
  stretch: number,
  wave: number,
  flail: number, // stumbling
  at: number // time inside the current behaviour
): number[] {
  'worklet';
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // side 0 = near (drawn in front), side 1 = far
  const leg = (side: number) => {
    const p = phase + side * Math.PI;
    let a = lerp(
      lerp(side === 0 ? 0.05 : -0.05, 0.15 + 0.82 * Math.sin(p), r),
      side === 0 ? 1.05 : -0.55,
      air
    ); // thigh angle, forward positive
    let k = lerp(
      lerp(0.02, 0.28 + 1.05 * Math.max(0, Math.cos(p)), r),
      side === 0 ? 1.35 : 0.7,
      air
    ); // knee bend: the shin folds back

    // Sitting: thighs out flat, shins dangling and gently swinging
    const sitA = side === 0 ? 1.5 : 1.38;
    const sitK = sitA - (0.06 + 0.22 * Math.sin(at * 4 + side * 1.7));
    a = lerp(a, sitA, sit);
    k = lerp(k, sitK, sit);

    // Stumbling: legs windmill for balance
    const flailA = (side === 0 ? 0.55 : -0.45) + 0.25 * Math.sin(at * 15 + side * 2);
    a = lerp(a, flailA, flail);
    k = lerp(k, 0.5, flail);

    const kx = THIGH * Math.sin(a);
    const ky = THIGH * Math.cos(a);
    const fx = kx + SHIN * Math.sin(a - k);
    const fy = ky + SHIN * Math.cos(a - k);
    return { kx, ky, fx, fy };
  };
  const near = leg(0);
  const far = leg(1);

  const hipX = W / 2;
  const grounded = FEET_Y - Math.max(near.fy, far.fy); // lowest foot touches the ground
  const hipY = lerp(grounded, FEET_Y - 1.5, sit); // sitting: hips rest on the surface

  let lean = 0.24 * r * (1 - air) + 0.1 * air;
  lean = lerp(lean, 0.05, sit) - 0.14 * stretch - 0.32 * flail;
  const shX = hipX + TORSO * Math.sin(lean);
  const shY = hipY - TORSO * Math.cos(lean);
  const headX = shX + 8.5 * Math.sin(lean * 1.15);
  const headY = shY - 8.5 * Math.cos(lean * 1.15);

  const arm = (side: number) => {
    const p = phase + side * Math.PI + Math.PI; // swings against the same-side leg
    let upper = lerp(
      lerp(side === 0 ? 0.08 : -0.08, 0.1 + 0.95 * Math.sin(p), r),
      side === 0 ? 2.7 : 2.3,
      air
    );
    let fore = lerp(lerp(upper + 0.12, upper + 1.45, r), upper + 0.2, air);

    // Sitting: hands resting on the lap
    upper = lerp(upper, 0.45, sit);
    fore = lerp(fore, 1.15, sit);

    // Stretching: both arms reaching for the sky
    const stretchU = side === 0 ? 2.9 : 2.7;
    upper = lerp(upper, stretchU, stretch);
    fore = lerp(fore, stretchU + 0.05, stretch);

    // Waving: near arm up, forearm swishing
    if (side === 0) {
      const waveU = 2.5;
      upper = lerp(upper, waveU, wave);
      fore = lerp(fore, waveU - 0.35 + 0.65 * Math.sin(at * 13), wave);
    }

    // Stumbling: arms flung about
    const flailU = (side === 0 ? 2.3 : 2.0) + 0.8 * Math.sin(at * 16 + side * 2.2);
    upper = lerp(upper, flailU, flail);
    fore = lerp(fore, flailU + 0.35, flail);

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

/** One spark of the celebration burst: flies out from the little man and fades. */
function Spark({
  burst,
  px,
  py,
  angle,
  distance,
  color,
}: {
  burst: SharedValue<number>; // 0..1 while a burst plays, 1 when idle
  px: SharedValue<number>;
  py: SharedValue<number>;
  angle: number;
  distance: number;
  color: string;
}) {
  'use no memo';
  const style = useAnimatedStyle(() => {
    const e = Math.min(1, Math.max(0, burst.value));
    const out = 1 - (1 - e) * (1 - e); // ease-out
    return {
      opacity: e >= 1 ? 0 : 1 - e,
      transform: [
        { translateX: px.value - 2.5 + Math.cos(angle) * distance * out },
        { translateY: py.value - 20 + Math.sin(angle) * distance * out + 14 * e * e },
        { scale: 1 - 0.5 * e },
      ],
    };
  });
  return <Animated.View pointerEvents="none" style={[styles.spark, { backgroundColor: color }, style]} />;
}

// Palette: near side in full colour, far side a shade darker for depth
const SKIN = '#EBB98C';
const SKIN_FAR = '#C99768';
const HAIR = '#3A2415';

const HIT_HALF_WIDTH = 17; // how generously a fingertip may miss him, in points
const HIT_ABOVE = 36;
const HIT_BELOW = 8;

/**
 * A little man who runs along the Today header: across the "Day x of y" line,
 * down onto the "Today's Word" title, and up onto the streak badge, then back
 * again, forever. A touch makes him stop and stand straight. Now and then he
 * sits, stretches or looks around; tapping him makes him wave or hop; a hard
 * scroll makes him stumble; and completing the day sends him racing to the
 * badge to celebrate.
 */
export function RunningMan({ anchors, touching, ref }: RunningManProps) {
  'use no memo'; // worklets read shared values directly; keep the compiler out
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<View>(null);
  const lastScrollY = useRef(0);
  const lastStumble = useRef(0);

  const segs = useSharedValue<Segment[]>([]);
  const total = useSharedValue(0);
  const tau = useSharedValue(0); // time along the path
  const dir = useSharedValue(1); // +1 forwards, -1 back
  const face = useSharedValue(1); // which way he is looking (+1 right)
  const hold = useSharedValue(0); // remaining stand-still time after a touch
  const phase = useSharedValue(0); // run-cycle phase
  const px = useSharedValue(-100);
  const py = useSharedValue(-100);
  const reduced = useSharedValue(false);

  // Pose weights, each eased toward its target every frame
  const runAmt = useSharedValue(0); // 0 = standing, 1 = full stride
  const air = useSharedValue(0);
  const sit = useSharedValue(0);
  const stretch = useSharedValue(0);
  const wave = useSharedValue(0);
  const flail = useSharedValue(0);

  // Behaviour state
  const command = useSharedValue(0); // requested action kind, consumed by the frame loop
  const actKind = useSharedValue(0); // 0 = none
  const actT = useSharedValue(0); // seconds into the current action
  const lookBase = useSharedValue(1);
  const rushing = useSharedValue(false); // racing to the badge to celebrate
  const idleTimer = useSharedValue(7); // seconds of running until his next idle moment
  const pendingSit = useSharedValue(false); // wants to sit, waiting to reach the title's edge
  const sitWait = useSharedValue(0);
  const bursts = useSharedValue(0); // how many spark bursts this celebration has fired
  const spark = useSharedValue(1); // spark animation progress, 1 = idle

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
    face.value = 1;
  }, [anchors, segs, total, tau, dir, face]);

  useImperativeHandle(
    ref,
    () => ({
      touch(pageX, pageY) {
        rootRef.current?.measureInWindow((ox, oy) => {
          const x = ox + px.get();
          const y = oy + py.get();
          const hit =
            Math.abs(pageX - x) <= HIT_HALF_WIDTH && pageY >= y - HIT_ABOVE && pageY <= y + HIT_BELOW;
          if (hit) command.set(Math.random() < 0.5 ? WAVE : HOP);
        });
      },
      scrolled(offsetY) {
        const jump = Math.abs(offsetY - lastScrollY.current);
        lastScrollY.current = offsetY;
        const now = Date.now();
        if (jump > 7 && now - lastStumble.current > 4000) {
          lastStumble.current = now;
          command.set(STUMBLE);
        }
      },
      celebrate() {
        command.set(CELEBRATE);
      },
    }),
    [px, py, command]
  );

  const frame = useFrameCallback((info) => {
    'worklet';
    const list = segs.value;
    if (list.length === 0) return;
    const dt = Math.min((info.timeSincePreviousFrame ?? 16) / 1000, 0.05);
    const canAct = !reduced.value;

    const indexAt = (t: number) => {
      let idx = 0;
      for (let i = 0; i < list.length; i++) {
        if (t >= list[i].t0) idx = i;
      }
      return idx;
    };

    // 1. Requests from the screen
    const cmd = command.value;
    if (cmd !== 0) {
      command.value = 0;
      if (canAct) {
        if (cmd === CELEBRATE) {
          rushing.value = true;
          actKind.value = 0;
          pendingSit.value = false;
        } else if (actKind.value === 0 && !rushing.value && list[indexAt(tau.value)].kind === 0) {
          actKind.value = cmd;
          actT.value = 0;
          if (cmd === LOOK) lookBase.value = face.value;
        }
      }
    }

    // 2. A touch (or reduced-motion) keeps him standing; he waits a beat after release
    if (touching.value || reduced.value) {
      hold.value = RESUME_DELAY;
    } else {
      hold.value = Math.max(0, hold.value - dt);
    }
    const wantStop = hold.value > 0;

    const beforeIdx = indexAt(tau.value);
    const before = list[beforeIdx];
    const acting = actKind.value > 0;
    const rush = rushing.value;
    // He never freezes mid-air: finish the jump first, then stand
    const stopped = !rush && (acting || (wantStop && before.kind === 0));

    // 3. Now and then he fancies an idle moment while running
    if (canAct && !acting && !rush && !stopped && before.kind === 0 && runAmt.value > 0.6) {
      idleTimer.value -= dt;
      if (!pendingSit.value && idleTimer.value <= 0) {
        const pick = Math.random();
        if (pick < 0.4) {
          pendingSit.value = true; // he'll sit at the edge of the title
          sitWait.value = 14;
        } else {
          actKind.value = pick < 0.7 ? STRETCH : LOOK;
          actT.value = 0;
          if (actKind.value === LOOK) lookBase.value = face.value;
        }
      }
      if (pendingSit.value) {
        sitWait.value -= dt;
        if (sitWait.value <= 0) {
          pendingSit.value = false; // never reached the edge; stretch instead
          actKind.value = STRETCH;
          actT.value = 0;
        }
      }
    }

    // 4. Move along the path
    if (rush) {
      // race to the end of the path, which is the streak badge
      dir.value = 1;
      if (tau.value < total.value - 0.001) {
        tau.value = Math.min(total.value, tau.value + dt * 1.9);
      } else {
        rushing.value = false;
        actKind.value = CELEBRATE;
        actT.value = 0;
        bursts.value = 0;
      }
    } else if (!stopped) {
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
    if (!stopped) face.value = dir.value;

    const idx = indexAt(tau.value);
    const seg = list[idx];
    const u = Math.min(1, Math.max(0, (tau.value - seg.t0) / seg.dur));

    // Reached the edge of the title while wanting to sit: sit down
    if (pendingSit.value && !acting && !rush && seg.kind === 0 && idx === 2 && dir.value === 1 && u > 0.97) {
      pendingSit.value = false;
      actKind.value = SIT;
      actT.value = 0;
      face.value = 1;
    }

    // 5. Whatever he is doing right now
    let yOff = 0;
    let airT = seg.kind === 1 ? 1 : 0;
    let sitT = 0;
    let stretchT = 0;
    let waveT = 0;
    let flailT = 0;
    if (actKind.value > 0) {
      actT.value += dt;
      const kind = actKind.value;
      const at = actT.value;
      const dur = DURATIONS[kind];
      if (kind === SIT) {
        sitT = at < dur - 0.4 ? 1 : 0;
      } else if (kind === STRETCH) {
        stretchT = at < dur - 0.35 ? 1 : 0;
      } else if (kind === LOOK) {
        face.value = at > 0.5 && at < 1.6 ? -lookBase.value : lookBase.value;
      } else if (kind === WAVE) {
        waveT = at < dur - 0.3 ? 1 : 0;
      } else if (kind === HOP) {
        const h = Math.min(1, at / dur);
        yOff = -4 * 12 * h * (1 - h);
        airT = 1;
      } else if (kind === STUMBLE) {
        flailT = at < dur - 0.4 ? 1 : 0;
      } else if (kind === CELEBRATE) {
        // three victory jumps, then arms held high
        let hopping = false;
        for (let n = 0; n < 3; n++) {
          const h = (at - 0.25 - 0.6 * n) / 0.55;
          if (h >= 0 && h <= 1) {
            yOff = -4 * 15 * h * (1 - h);
            hopping = true;
          }
        }
        if (hopping) airT = 1;
        else stretchT = 1;
        if (bursts.value === 0 && at > 0.5) {
          bursts.value = 1;
          spark.value = 0;
        } else if (bursts.value === 1 && at > 1.75) {
          bursts.value = 2;
          spark.value = 0;
        }
      }
      if (at >= dur) {
        actKind.value = 0;
        idleTimer.value = 6 + Math.random() * 6;
      }
    }
    if (spark.value < 1) spark.value = Math.min(1, spark.value + dt / 0.9);

    px.value = seg.x0 + (seg.x1 - seg.x0) * u;
    py.value =
      seg.y0 + (seg.y1 - seg.y0) * u - (seg.kind === 1 ? 4 * seg.rise * u * (1 - u) : 0) + yOff;

    // 6. Ease every pose weight toward its target
    const running = !stopped && seg.kind === 0;
    const k = Math.min(1, dt * 12);
    runAmt.value += ((running ? 1 : 0) - runAmt.value) * k;
    air.value += (airT - air.value) * k;
    sit.value += (sitT - sit.value) * k;
    stretch.value += (stretchT - stretch.value) * k;
    wave.value += (waveT - wave.value) * k;
    flail.value += (flailT - flail.value) * k;
    if (running) phase.value += dt * CADENCE * (rush ? 1.5 : 1);
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
      { scaleX: face.value },
    ],
  }));

  const pose = useDerivedValue(() =>
    computePose(
      phase.value,
      runAmt.value,
      air.value,
      sit.value,
      stretch.value,
      wave.value,
      flail.value,
      actT.value
    )
  );

  const shirt = theme.primary;
  const shirtFar = Colors.primaryDark;
  const shorts = Colors.accent;
  const shortsFar = Colors.accentDark;
  const shoe = theme.textPrimary;

  const sparkColors = [theme.primaryLight, theme.streak, '#FFD66B', theme.primary];

  return (
    <>
      {/* zero-size marker used to find where the header sits on screen */}
      <View ref={rootRef} collapsable={false} pointerEvents="none" style={styles.marker} />

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

      {/* celebration sparks */}
      {Array.from({ length: 12 }, (_, i) => (
        <Spark
          key={i}
          burst={spark}
          px={px}
          py={py}
          angle={(i / 12) * Math.PI * 2 + (i % 2) * 0.2}
          distance={i % 2 === 0 ? 30 : 20}
          color={sparkColors[i % sparkColors.length]}
        />
      ))}
    </>
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
  marker: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
  },
  spark: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    opacity: 0,
  },
});

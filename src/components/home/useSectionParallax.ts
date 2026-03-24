"use client";

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

type SectionParallaxOptions = {
  distance?: number;
  rotate?: number;
};

export function useSectionParallax<T extends HTMLElement>({
  distance = 80,
  rotate = 6,
}: SectionParallaxOptions = {}) {
  const ref = useRef<T | null>(null);
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = mounted && !prefersReducedMotion;
  const safeDistance = motionEnabled ? distance : 0;
  const safeRotate = motionEnabled ? rotate : 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 22,
    mass: 0.25,
  });

  const backgroundY = useTransform(progress, [0, 1], [safeDistance, -safeDistance]);
  const foregroundY = useTransform(progress, [0, 1], [safeDistance * 0.45, -safeDistance * 0.45]);
  const accentY = useTransform(progress, [0, 1], [-safeDistance * 0.3, safeDistance * 0.3]);
  const driftX = useTransform(progress, [0, 1], [-safeDistance * 0.2, safeDistance * 0.2]);
  const rotateZ = useTransform(progress, [0, 1], [-safeRotate, safeRotate]);
  const scale = useTransform(progress, [0, 0.5, 1], motionEnabled ? [0.97, 1, 0.97] : [1, 1, 1]);

  return {
    ref,
    backgroundY,
    foregroundY,
    accentY,
    driftX,
    rotateZ,
    scale,
  };
}

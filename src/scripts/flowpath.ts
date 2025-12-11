/**
 * Flow Path Visualization
 *
 * Animated workflow path system with ping animations
 * connecting trigger, workflow cards, and result elements using GSAP.
 */

import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

// Register GSAP plugin
gsap.registerPlugin(MotionPathPlugin);

interface ElementPosition {
  x: number;
  top: number;
  bottom: number;
  centerY: number;
}

/**
 * Initialize the flow path visualization
 * Creates animated connection paths between workflow elements
 */
export function initFlowPath(): void {
  const flowSystem = document.querySelector('.flow-system') as HTMLElement;
  if (!flowSystem) return;

  const svg = flowSystem.querySelector('.flow-path-svg') as SVGSVGElement;
  const pathGlow = svg?.querySelector('.flow-path-glow') as SVGPathElement;
  const pathStructure = svg?.querySelector('.flow-path-structure:not(.flow-path-fast)') as SVGPathElement;
  const pathFast = svg?.querySelector('.flow-path-fast') as SVGPathElement;

  if (!svg || !pathStructure) return;

  // Only run on desktop
  if (window.innerWidth < 768) return;

  const triggerBanner = flowSystem.querySelector('.trigger-banner');
  const triggerIcon = triggerBanner?.querySelector('.trigger-icon');
  const cards = flowSystem.querySelectorAll('.workflow-card');
  const resultBanner = flowSystem.querySelector('.result-banner');
  const resultIcon = resultBanner?.querySelector('.result-icon');

  if (!triggerBanner || !triggerIcon || cards.length === 0 || !resultBanner || !resultIcon) return;

  // Kill any existing animations
  gsap.killTweensOf('.flow-ping');

  const flowSystemRect = flowSystem.getBoundingClientRect();

  function getRelativePos(element: Element): ElementPosition {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - flowSystemRect.left,
      top: rect.top - flowSystemRect.top,
      bottom: rect.bottom - flowSystemRect.top,
      centerY: rect.top + rect.height / 2 - flowSystemRect.top
    };
  }

  const trigger = getRelativePos(triggerIcon);
  const card1 = getRelativePos(cards[0]);
  const card2 = getRelativePos(cards[1]);
  const card3 = getRelativePos(cards[2]);
  const result = getRelativePos(resultIcon);

  // Key Y positions
  const spineY = trigger.bottom + (card1.top - trigger.bottom) / 2;
  const convergeY = card1.bottom + 24;
  const centerX = card2.x;

  // Build the static path structure
  let structurePath = '';

  // Trigger down to spine
  structurePath += `M ${centerX} ${trigger.bottom} L ${centerX} ${spineY}`;

  // Horizontal spine
  structurePath += ` M ${card1.x} ${spineY} L ${card3.x} ${spineY}`;

  // Branches down into cards
  structurePath += ` M ${card1.x} ${spineY} L ${card1.x} ${card1.top}`;
  structurePath += ` M ${card2.x} ${spineY} L ${card2.x} ${card2.top}`;
  structurePath += ` M ${card3.x} ${spineY} L ${card3.x} ${card3.top}`;

  // Card bottoms down to converge
  structurePath += ` M ${card1.x} ${card1.bottom} L ${card1.x} ${convergeY}`;
  structurePath += ` M ${card2.x} ${card2.bottom} L ${card2.x} ${convergeY}`;
  structurePath += ` M ${card3.x} ${card3.bottom} L ${card3.x} ${convergeY}`;

  // Converge line
  structurePath += ` M ${card1.x} ${convergeY} L ${card3.x} ${convergeY}`;

  // Down to result
  structurePath += ` M ${centerX} ${convergeY} L ${centerX} ${result.top}`;

  // Set SVG viewBox to match the flow system dimensions
  const flowHeight = flowSystem.offsetHeight;
  const flowWidth = flowSystem.offsetWidth;
  svg.setAttribute('viewBox', `0 0 ${flowWidth} ${flowHeight}`);
  svg.style.width = `${flowWidth}px`;
  svg.style.height = `${flowHeight}px`;

  // Set path data on all path layers
  pathStructure.setAttribute('d', structurePath);
  if (pathGlow) pathGlow.setAttribute('d', structurePath);
  if (pathFast) pathFast.setAttribute('d', structurePath);

  // Add animated class
  flowSystem.classList.add('animated');

  // Get all ping elements
  const pingTrigger = svg.querySelector('.flow-ping-trigger') as SVGCircleElement;
  const pingBranch1 = svg.querySelector('.flow-ping-branch1') as SVGCircleElement;
  const pingBranch2 = svg.querySelector('.flow-ping-branch2') as SVGCircleElement;
  const pingBranch3 = svg.querySelector('.flow-ping-branch3') as SVGCircleElement;
  const pingConverge1 = svg.querySelector('.flow-ping-converge1') as SVGCircleElement;
  const pingConverge2 = svg.querySelector('.flow-ping-converge2') as SVGCircleElement;
  const pingConverge3 = svg.querySelector('.flow-ping-converge3') as SVGCircleElement;
  const pingResult = svg.querySelector('.flow-ping-result') as SVGCircleElement;

  if (!pingTrigger || !pingBranch1 || !pingBranch2 || !pingBranch3 ||
      !pingConverge1 || !pingConverge2 || !pingConverge3 || !pingResult) return;

  // Create master timeline that repeats - ALL animations in one timeline for perfect sync
  // Fast cycle for high-speed network feel
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.3 });

  // ============================================
  // PHASE 1: Trigger (0s - 0.4s)
  // Ping leaves trigger, travels down to spine
  // ============================================
  const triggerStart = 0;
  const triggerEnd = 0.35;

  // Trigger banner lights up when ping starts
  tl.to(triggerBanner, {
    boxShadow: '0 0 20px rgba(220, 38, 38, 0.25)',
    borderColor: 'rgba(220, 38, 38, 0.4)',
    duration: 0.15,
    ease: 'power2.out'
  }, triggerStart)
  .to(triggerBanner, {
    boxShadow: '0 0 8px rgba(220, 38, 38, 0.1)',
    borderColor: 'rgba(220, 38, 38, 0.2)',
    duration: 0.2,
    ease: 'power2.inOut'
  }, triggerStart + 0.2);

  // Trigger ping animation
  tl.set(pingTrigger, { attr: { cx: centerX, cy: trigger.bottom }, opacity: 0 }, triggerStart)
    .to(pingTrigger, {
      attr: { cy: spineY },
      opacity: 0.9,
      duration: triggerEnd - triggerStart,
      ease: 'power1.inOut'
    }, triggerStart)
    .to(pingTrigger, { opacity: 0, duration: 0.1 }, triggerEnd);

  // ============================================
  // PHASE 2: Branch to cards (0.4s - 0.85s)
  // Pings spread horizontally then down into cards
  // ============================================
  const branchStart = 0.4;
  const branchHorizontalEnd = 0.6;
  const branchVerticalEnd = 0.85;

  // Set initial positions for branch pings
  tl.set([pingBranch1, pingBranch2, pingBranch3], {
    attr: { cx: centerX, cy: spineY },
    opacity: 0
  }, branchStart - 0.1);

  // Branch 1 - goes left then down
  tl.to(pingBranch1, {
    attr: { cx: card1.x },
    opacity: 0.9,
    duration: branchHorizontalEnd - branchStart,
    ease: 'power1.out'
  }, branchStart)
  .to(pingBranch1, {
    attr: { cy: card1.top },
    duration: branchVerticalEnd - branchHorizontalEnd,
    ease: 'power1.in'
  }, branchHorizontalEnd)
  .to(pingBranch1, { opacity: 0, duration: 0.1 }, branchVerticalEnd);

  // Branch 2 - goes straight down (arrives first)
  const branch2ArriveTime = branchVerticalEnd - 0.1; // Arrives slightly earlier
  tl.to(pingBranch2, {
    opacity: 0.9,
    duration: 0.2
  }, branchStart)
  .to(pingBranch2, {
    attr: { cy: card2.top },
    duration: branch2ArriveTime - branchStart - 0.2,
    ease: 'power1.inOut'
  }, branchStart + 0.2)
  .to(pingBranch2, { opacity: 0, duration: 0.1 }, branchVerticalEnd);

  // Branch 3 - goes right then down
  tl.to(pingBranch3, {
    attr: { cx: card3.x },
    opacity: 0.9,
    duration: branchHorizontalEnd - branchStart,
    ease: 'power1.out'
  }, branchStart)
  .to(pingBranch3, {
    attr: { cy: card3.top },
    duration: branchVerticalEnd - branchHorizontalEnd,
    ease: 'power1.in'
  }, branchHorizontalEnd)
  .to(pingBranch3, { opacity: 0, duration: 0.1 }, branchVerticalEnd);

  // Cards light up exactly when their ping arrives (fast stagger based on arrival)
  const cardElements = Array.from(cards) as HTMLElement[];
  const cardArrivalTimes = [branchVerticalEnd, branch2ArriveTime, branchVerticalEnd]; // card1, card2, card3
  const sortedByArrival = [1, 0, 2]; // card2 arrives first, then card1 and card3

  sortedByArrival.forEach((cardIndex, order) => {
    const card = cardElements[cardIndex] as HTMLElement;
    const arriveTime = cardArrivalTimes[cardIndex];
    const stagger = order * 0.03; // 30ms stagger in arrival order (faster)

    // Animate the card glow
    tl.to(card, {
      boxShadow: '0 4px 20px rgba(160, 160, 160, 0.2), 0 0 12px rgba(140, 140, 140, 0.15)',
      duration: 0.1,
      ease: 'power2.out'
    }, arriveTime - 0.03 + stagger)
    // Fade out the glow
    .to(card, {
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
      duration: 0.2,
      ease: 'power2.inOut'
    }, arriveTime + 0.1 + stagger);
  });

  // ============================================
  // PHASE 3: Converge from cards (0.9s - 1.4s)
  // Pings leave card bottoms and converge to center
  // ============================================
  const convergeStart = 0.9;
  const convergeVerticalEnd = 1.15;
  const convergeHorizontalEnd = 1.4;

  // Converge 1 - from card 1
  tl.set(pingConverge1, {
    attr: { cx: card1.x, cy: card1.bottom },
    opacity: 0
  }, convergeStart)
  .to(pingConverge1, {
    attr: { cy: convergeY },
    opacity: 0.9,
    duration: convergeVerticalEnd - convergeStart - 0.1,
    ease: 'power1.out'
  }, convergeStart + 0.1)
  .to(pingConverge1, {
    attr: { cx: centerX },
    duration: convergeHorizontalEnd - convergeVerticalEnd,
    ease: 'power1.inOut'
  }, convergeVerticalEnd)
  .to(pingConverge1, { opacity: 0, duration: 0.1 }, convergeHorizontalEnd);

  // Converge 2 - from card 2 (straight down)
  tl.set(pingConverge2, {
    attr: { cx: card2.x, cy: card2.bottom },
    opacity: 0
  }, convergeStart)
  .to(pingConverge2, {
    attr: { cy: convergeY },
    opacity: 0.9,
    duration: convergeVerticalEnd - convergeStart,
    ease: 'power1.out'
  }, convergeStart + 0.1)
  .to(pingConverge2, { opacity: 0, duration: 0.1 }, convergeHorizontalEnd);

  // Converge 3 - from card 3
  tl.set(pingConverge3, {
    attr: { cx: card3.x, cy: card3.bottom },
    opacity: 0
  }, convergeStart)
  .to(pingConverge3, {
    attr: { cy: convergeY },
    opacity: 0.9,
    duration: convergeVerticalEnd - convergeStart - 0.1,
    ease: 'power1.out'
  }, convergeStart + 0.1)
  .to(pingConverge3, {
    attr: { cx: centerX },
    duration: convergeHorizontalEnd - convergeVerticalEnd,
    ease: 'power1.inOut'
  }, convergeVerticalEnd)
  .to(pingConverge3, { opacity: 0, duration: 0.1 }, convergeHorizontalEnd);

  // ============================================
  // PHASE 4: Result (1.45s - 1.85s)
  // Ping travels down to result
  // ============================================
  const resultStart = 1.45;
  const resultEnd = 1.85;

  tl.set(pingResult, {
    attr: { cx: centerX, cy: convergeY },
    opacity: 0
  }, convergeHorizontalEnd)
  .to(pingResult, {
    attr: { cy: result.top },
    opacity: 0.9,
    duration: resultEnd - resultStart,
    ease: 'power1.inOut'
  }, resultStart)
  .to(pingResult, { opacity: 0, duration: 0.2 }, resultEnd);

  // Result banner lights up exactly when ping arrives
  tl.to(resultBanner, {
    boxShadow: '0 0 20px rgba(34, 197, 94, 0.25)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    duration: 0.15,
    ease: 'power2.out'
  }, resultEnd - 0.03)
  .to(resultBanner, {
    boxShadow: '0 0 8px rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
    duration: 0.25,
    ease: 'power2.inOut'
  }, resultEnd + 0.15);
}

// Note: Auto-initialization removed - importing component handles init
// Export function for external use

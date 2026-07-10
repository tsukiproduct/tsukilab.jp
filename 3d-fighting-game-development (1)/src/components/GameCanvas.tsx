import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface GameCanvasProps {
  onHealthChange: (p1Health: number, p2Health: number) => void;
}

interface Fighter {
  mesh: THREE.Group;
  position: { x: number; z: number };
  health: number;
  attacking: boolean;
  velocity: { x: number; z: number };
  direction: number; // 1 for right, -1 for left
  attackCooldown: number;
  lastAttackDirection: 'punch' | 'kick' | 'special' | null;
}

export default function GameCanvas({ onHealthChange }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const fighter1Ref = useRef<Fighter | null>(null);
  const fighter2Ref = useRef<Fighter | null>(null);
  const keysPressed = useRef<Record<string, boolean>>({});


  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(20, 15);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3436 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Ring walls
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x636e72 });
    
    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 0.5), wallMaterial);
    backWall.position.set(0, 1.5, -7.5);
    backWall.castShadow = true;
    scene.add(backWall);

    // Front wall
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 0.5), wallMaterial);
    frontWall.position.set(0, 1.5, 7.5);
    frontWall.castShadow = true;
    scene.add(frontWall);

    // Create fighters
    const createFighter = (startX: number, color: number): Fighter => {
      const group = new THREE.Group();
      
      // Body
      const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
      const bodyMaterial = new THREE.MeshLambertMaterial({ color });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.8;
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
      const headMaterial = new THREE.MeshLambertMaterial({ color: 0xf8b88b });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.8;
      head.castShadow = true;
      group.add(head);

      // Arms
      const armGeometry = new THREE.CapsuleGeometry(0.15, 0.9, 4, 8);
      const armMaterial = new THREE.MeshLambertMaterial({ color });
      
      const leftArm = new THREE.Mesh(armGeometry, armMaterial);
      leftArm.position.set(-0.5, 1.2, 0);
      leftArm.castShadow = true;
      group.add(leftArm);

      const rightArm = new THREE.Mesh(armGeometry, armMaterial);
      rightArm.position.set(0.5, 1.2, 0);
      rightArm.castShadow = true;
      group.add(rightArm);

      // Legs
      const legGeometry = new THREE.CapsuleGeometry(0.15, 1, 4, 8);
      const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });

      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(-0.25, 0.4, 0);
      leftLeg.castShadow = true;
      group.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(0.25, 0.4, 0);
      rightLeg.castShadow = true;
      group.add(rightLeg);

      group.position.set(startX, 0, 0);

      return {
        mesh: group,
        position: { x: startX, z: 0 },
        health: 100,
        attacking: false,
        velocity: { x: 0, z: 0 },
        direction: startX < 0 ? 1 : -1,
        attackCooldown: 0,
        lastAttackDirection: null,
      };
    };

    const fighter1 = createFighter(-4, 0xff6b6b);
    const fighter2 = createFighter(4, 0x4ecdc4);

    scene.add(fighter1.mesh);
    scene.add(fighter2.mesh);

    fighter1Ref.current = fighter1;
    fighter2Ref.current = fighter2;

    // Input handling
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Game loop
    let animationId: number;
    let gameTimer = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      gameTimer++;



      if (!fighter1Ref.current || !fighter2Ref.current) return;

      const f1 = fighter1Ref.current;
      const f2 = fighter2Ref.current;

      // Update fighter 1 input (WASD + Space)
      if (keysPressed.current['w']) f1.position.z = Math.max(-6, f1.position.z - 0.15);
      if (keysPressed.current['s']) f1.position.z = Math.min(6, f1.position.z + 0.15);
      if (keysPressed.current['a']) f1.position.x = Math.max(-8, f1.position.x - 0.15);
      if (keysPressed.current['d']) f1.position.x = Math.min(0, f1.position.x + 0.15);
      if (keysPressed.current[' '] && f1.attackCooldown === 0) {
        f1.attacking = true;
        f1.attackCooldown = 15;
        f1.lastAttackDirection = 'punch';
      }
      if (keysPressed.current['shift'] && f1.attackCooldown === 0) {
        f1.attacking = true;
        f1.attackCooldown = 20;
        f1.lastAttackDirection = 'kick';
      }

      // Update fighter 2 input (Arrow keys + Enter)
      if (keysPressed.current['arrowup']) f2.position.z = Math.max(-6, f2.position.z - 0.15);
      if (keysPressed.current['arrowdown']) f2.position.z = Math.min(6, f2.position.z + 0.15);
      if (keysPressed.current['arrowleft']) f2.position.x = Math.max(0, f2.position.x - 0.15);
      if (keysPressed.current['arrowright']) f2.position.x = Math.min(8, f2.position.x + 0.15);
      if (keysPressed.current['enter'] && f2.attackCooldown === 0) {
        f2.attacking = true;
        f2.attackCooldown = 15;
        f2.lastAttackDirection = 'punch';
      }
      if (keysPressed.current['control'] && f2.attackCooldown === 0) {
        f2.attacking = true;
        f2.attackCooldown = 20;
        f2.lastAttackDirection = 'kick';
      }

      // Update cooldowns
      if (f1.attackCooldown > 0) f1.attackCooldown--;
      if (f2.attackCooldown > 0) f2.attackCooldown--;

      // Reset attacking state
      if (f1.attackCooldown === 0) f1.attacking = false;
      if (f2.attackCooldown === 0) f2.attacking = false;

      // Check collision and damage
      const distance = Math.sqrt(
        Math.pow(f1.position.x - f2.position.x, 2) +
        Math.pow(f1.position.z - f2.position.z, 2)
      );

      if (f1.attacking && distance < 2.5) {
        const damage = f1.lastAttackDirection === 'kick' ? 15 : 10;
        f2.health = Math.max(0, f2.health - damage);
      }

      if (f2.attacking && distance < 2.5) {
        const damage = f2.lastAttackDirection === 'kick' ? 15 : 10;
        f1.health = Math.max(0, f1.health - damage);
      }

      // Update positions
      f1.mesh.position.set(f1.position.x, 0, f1.position.z);
      f2.mesh.position.set(f2.position.x, 0, f2.position.z);

      // Apply attack animations
      if (f1.attacking) {
        if (f1.lastAttackDirection === 'kick') {
          f1.mesh.scale.set(1.1, 1, 1.1);
        } else {
          f1.mesh.scale.set(1.05, 1, 1);
        }
      } else {
        f1.mesh.scale.set(1, 1, 1);
      }

      if (f2.attacking) {
        if (f2.lastAttackDirection === 'kick') {
          f2.mesh.scale.set(1.1, 1, 1.1);
        } else {
          f2.mesh.scale.set(1.05, 1, 1);
        }
      } else {
        f2.mesh.scale.set(1, 1, 1);
      }

      // Face each other
      if (f1.position.x < f2.position.x) {
        f1.mesh.scale.x = Math.abs(f1.mesh.scale.x);
        f2.mesh.scale.x = -Math.abs(f2.mesh.scale.x);
      } else {
        f1.mesh.scale.x = -Math.abs(f1.mesh.scale.x);
        f2.mesh.scale.x = Math.abs(f2.mesh.scale.x);
      }

      onHealthChange(f1.health, f2.health);

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [onHealthChange]);

  return <div ref={containerRef} className="w-full h-full" />;
}

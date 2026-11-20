"use strict";
// Gravity projected into device coordinates, followed by screen orientation.
const Gravity = {
  orientationVector(beta, gamma) {
    const pitch = (beta * Math.PI) / 180;
    const roll = (gamma * Math.PI) / 180;
    return [Math.cos(pitch) * Math.sin(roll), Math.sin(pitch)];
  },
  screenVector(x, y, degrees) {
    const a = (degrees * Math.PI) / 180;
    return [
      x * Math.cos(a) + y * Math.sin(a),
      y * Math.cos(a) - x * Math.sin(a),
    ];
  },
};

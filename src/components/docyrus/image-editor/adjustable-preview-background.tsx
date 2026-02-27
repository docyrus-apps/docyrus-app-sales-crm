'use client';

import {
  type CropperImage,
  type CropperState,
  type CropperTransitions,
  type Size
} from 'react-advanced-cropper';

import { getPreviewStyle } from 'advanced-cropper';

import { AdjustableImage } from './adjustable-image';

interface CropperRef {
  getState: () => CropperState;
  getTransitions: () => CropperTransitions;
  getImage: () => CropperImage;
}

interface AdjustablePreviewBackgroundProps {
  className?: string;
  cropper: CropperRef;
  crossOrigin?: 'anonymous' | 'use-credentials' | boolean;
  brightness?: number;
  saturation?: number;
  hue?: number;
  contrast?: number;
  size?: Size | null;
}

function AdjustablePreviewBackground({
  className,
  cropper,
  crossOrigin,
  brightness = 0,
  saturation = 0,
  hue = 0,
  contrast = 0,
  size
}: AdjustablePreviewBackgroundProps) {
  const state = cropper.getState();
  const transitions = cropper.getTransitions();
  const image = cropper.getImage();

  const style
    = image && state && size
      ? getPreviewStyle(image, state, size, transitions)
      : {};

  return (
    <AdjustableImage
      src={image?.src}
      crossOrigin={crossOrigin}
      brightness={brightness}
      saturation={saturation}
      hue={hue}
      contrast={contrast}
      className={className}
      style={style} />
  );
}

export { AdjustablePreviewBackground };
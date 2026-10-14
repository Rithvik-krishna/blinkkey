import { desktopCapturer, screen } from 'electron';
import { DisplayInfo } from '../../src/types';

export class ScreenCaptureEngine {
  public static getDisplays(): DisplayInfo[] {
    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();

    return displays.map((disp, index) => ({
      id: disp.id.toString(),
      name: `Display ${index + 1} (${disp.bounds.width}x${disp.bounds.height})${disp.id === primaryDisplay.id ? ' - Primary' : ''}`,
      bounds: {
        x: disp.bounds.x,
        y: disp.bounds.y,
        width: disp.bounds.width,
        height: disp.bounds.height,
      },
      isPrimary: disp.id === primaryDisplay.id,
    }));
  }

  public static async captureScreen(selectedDisplayId?: string): Promise<{ base64Image: string; width: number; height: number }> {
    const displays = screen.getAllDisplays();
    let targetDisplay = screen.getPrimaryDisplay();

    if (selectedDisplayId && selectedDisplayId !== 'primary') {
      const found = displays.find((d) => d.id.toString() === selectedDisplayId);
      if (found) {
        targetDisplay = found;
      }
    }

    const scaleFactor = targetDisplay.scaleFactor || 1;
    const captureWidth = Math.round(targetDisplay.bounds.width * scaleFactor);
    const captureHeight = Math.round(targetDisplay.bounds.height * scaleFactor);

    // Request desktop capture source
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.min(captureWidth, 2560),
        height: Math.min(captureHeight, 1440),
      },
      fetchWindowIcons: false,
    });

    if (!sources || sources.length === 0) {
      throw new Error('No screen display source available for capture');
    }

    // Match display by id if multiple displays exist
    let selectedSource = sources[0];
    if (sources.length > 1) {
      const displayIndex = displays.findIndex((d) => d.id === targetDisplay.id);
      if (displayIndex >= 0 && displayIndex < sources.length) {
        selectedSource = sources[displayIndex];
      }
    }

    const image = selectedSource.thumbnail;
    const size = image.getSize();
    // Convert to JPEG buffer (quality 85) to optimize transmission latency to AI Vision API
    const jpegBuffer = image.toJPEG(85);
    const base64 = jpegBuffer.toString('base64');

    return {
      base64Image: base64,
      width: size.width,
      height: size.height,
    };
  }
}

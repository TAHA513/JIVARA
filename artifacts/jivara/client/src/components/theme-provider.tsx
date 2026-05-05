import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { StoreSetting } from "@shared/schema";

interface ThemeProviderProps {
  children: React.ReactNode;
}

// Helper function to convert hex to HSL
function hexToHsl(hex: string): string {
  // Remove the hash if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Convert to degrees and percentages
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { data: settings = [], isLoading } = useQuery<StoreSetting[]>({
    queryKey: ["/api/settings"],
    staleTime: 0,
    refetchOnMount: true,
  });

  const getSetting = (key: string) => 
    settings.find(s => s.key === key)?.value || "";

  useEffect(() => {
    if (isLoading || settings.length === 0) return;
    
    const primaryColor = getSetting("primary_color") || "hsl(120, 85%, 45%)";
    const secondaryColor = getSetting("secondary_color") || "hsl(120, 15%, 96%)";
    const accentColor = getSetting("accent_color") || "hsl(120, 15%, 88%)";

    // Helper function to convert color to HSL format for CSS variables
    const toHslFormat = (color: string): string => {
      if (color.startsWith('hsl(')) {
        // Already HSL format like "hsl(120, 85%, 45%)"
        // Extract just the values: "120, 85%, 45%" -> "120 85% 45%"
        return color.replace('hsl(', '').replace(')', '').replace(/,/g, '');
      } else if (color.startsWith('#')) {
        // Hex format - convert to HSL
        return hexToHsl(color);
      }
      // Already in CSS variable format "120 85% 45%"
      return color;
    };

    const primaryHsl = toHslFormat(primaryColor);
    const secondaryHsl = toHslFormat(secondaryColor);
    const accentHsl = toHslFormat(accentColor);

    // Apply the custom colors to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary', primaryHsl);
    root.style.setProperty('--secondary', secondaryHsl);
    root.style.setProperty('--accent', accentHsl);
    root.style.setProperty('--ring', primaryHsl);

    // Set appropriate foreground color based on primary brightness
    const hslMatch = primaryHsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
    let foregroundColor = "210 40% 98%";
    if (hslMatch) {
      const lightness = parseInt(hslMatch[3]);
      foregroundColor = lightness > 50 ? "216 14% 15%" : "210 40% 98%";
      root.style.setProperty('--primary-foreground', foregroundColor);
    }

  }, [settings, isLoading]);

  return <>{children}</>;
}
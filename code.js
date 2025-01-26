// Show the UI
console.log("Showing UI...");
figma.showUI(__html__, { width: 800, height: 800 });

// Event listener for selection changes
figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;
  if (selection.length > 0) {
    const selectionInfo = selection.map(node => ({
      name: node.name,
      id: node.id,
    }));
    figma.ui.postMessage({
      type: 'selection-change',
      selection: selectionInfo,
    });
  } else {
    figma.ui.postMessage({ type: 'no-selection' });
  }
});

// Helper function to convert RGB color to hex
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Helper function to process color
function processColor(color) {
  if (color && 'r' in color) {
    return rgbToHex(
      Math.round(color.r * 255),
      Math.round(color.g * 255),
      Math.round(color.b * 255)
    );
  }
  return null;
}

// Helper function to process fills
function processFills(fills) {
  if (fills && fills.length > 0) {
    return fills.map(fill => {
      if (fill.type === "SOLID") {
        return `Solid: ${processColor(fill.color)}`;
      }
      return fill.type; // For other fill types, just return the type
    }).join(", ");
  }
  return null;
}

// Helper function to process effects
function processEffects(effects) {
  if (effects && effects.length > 0) {
    return effects.map(effect => {
      let effectDetails = `${effect.type}: `;
      if (effect.color) {
        effectDetails += `Color: ${processColor(effect.color)}, `;
        effectDetails += `Opacity: ${Math.round(effect.color.a * 100)}%, `;
      }
      if (effect.offset) {
        effectDetails += `Offset: X=${effect.offset.x}, Y=${effect.offset.y}, `;
      }
      if (effect.radius !== undefined) {
        effectDetails += `Radius: ${effect.radius}, `;
      }
      if (effect.spread !== undefined) {
        effectDetails += `Spread: ${effect.spread}, `;
      }
      if (effect.visible !== undefined) {
        effectDetails += `Visible: ${effect.visible}, `;
      }
      return effectDetails.slice(0, -2); // Remove trailing comma and space
    }).join("\n");
  }
  return null;
}

// Function to generate attributes for a node
function generateAttributesForNode(node) {
  const attributes = {
    name: node.name,
    width: node.width,
    height: node.height,
    fontSize: node.fontSize || null,
    fontName: node.fontName ? node.fontName.family : null,
    fontWeight: node.fontName ? node.fontName.style : null,
    textColor: node.fills && node.fills.length > 0 
      ? processColor(node.fills[0].color)
      : null,
    cornerRadius: node.cornerRadius || null,
    fills: processFills(node.fills),
    effects: processEffects(node.effects)
  };
  
  // Remove attributes with null values
  Object.keys(attributes).forEach(key => attributes[key] === null && delete attributes[key]);
  
  return attributes;
}

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-attributes') {
    const selection = figma.currentPage.selection;
    
    if (selection.length > 0) {
      const allAttributes = selection.map(node => generateAttributesForNode(node));
      figma.ui.postMessage({ type: 'show-attributes', allAttributes });
    }
  }
};

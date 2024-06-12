import matplotlib.pyplot as plt
import matplotlib.colors as mcolors


def getColorMapHexValue(
    value: float,
    min: float,
    max: float,
    numColorSteps: int = 32,
    colorMap: str = "hsv",
) -> str:
    """Get hexadecimal color value based on value and color map.

    Args:
        value (float): Value to get color for.
        min (float): Minimum value of the range.
        max (float): Maximum value of the range.
        numColorSteps (int, optional): Number of color steps. Defaults to 32.
        colorMap (str, optional): Color map. Defaults to "seismic".

    Returns:
        str: Hexadecimal color value.

    Raises:
        ValueError: If value is out of range.
        ValueError: If minimum value is greater than or equal to maximum value.
    """
    if value < min or value > max:
        raise ValueError("Value is out of range")

    if min >= max:
        raise ValueError("Minimum value is greater than or equal to maximum value")

    index = int((value - min) / (max - min + 1) * numColorSteps)
    cm = plt.get_cmap(colorMap)
    colors_rgb = [cm(x / (float(numColorSteps) - 1)) for x in range(numColorSteps)]
    colors_hex = [mcolors.rgb2hex(color) for color in colors_rgb]
    return colors_hex[index]


if __name__ == "__main__":
    print(getColorMapHexValue(0.2, 0, 1))

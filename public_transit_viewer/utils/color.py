import matplotlib.colors as m_colors
import matplotlib.pyplot as plt


def get_color_map_hex_value(
    value: float,
    min_value: float,
    max_value: float,
    num_color_steps: int = 32,
    color_map: str = "hsv",
) -> str:
    """Get hexadecimal color value based on value and color map.

    Args:
        value (float): Value to get color for.
        min_value (float): Minimum value of the range.
        max_value (float): Maximum value of the range.
        num_color_steps (int, optional): Number of color steps. Defaults to 32.
        color_map (str, optional): Color map. Defaults to "seismic".

    Returns:
        str: Hexadecimal color value.

    Raises:
        ValueError: If value is out of range.
        ValueError: If minimum value is greater than or equal to maximum value.
    """
    if value < min_value or value > max_value:
        raise ValueError("Value is out of range")

    if min_value >= max_value:
        raise ValueError("Minimum value is greater than or equal to maximum value")

    index = int((value - min_value) / (max_value - min_value + 1) * num_color_steps)
    cm = plt.get_cmap(color_map)
    colors_rgb = [cm(x / (float(num_color_steps) - 1)) for x in range(num_color_steps)]
    colors_hex = [m_colors.rgb2hex(color) for color in colors_rgb]
    return colors_hex[index]


if __name__ == "__main__":
    print(get_color_map_hex_value(0.2, 0, 1))

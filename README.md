# homebridge-dmxplugin

WIP. Control your DMX lights using homebridge. Supports single channel dimmer lights (W), RGB, RGB+Amber (RGBA), RGBW, RGBWA and Temperature White lights with cold and warm white LEDs (WWCW). Each light can have up to two channels per color and up to two dimmer/shutter/... channels that are always set to 255 (or 100%).

First beta will be uploaded soon.



This plugin is designed to work in combination with my dmx-cli software. You'll have to copy the dmx-cli.py and dmx-server.py script into the same location where they can be read by the user running homebridge and specify the path in your homebridge config.


Example config:
Accessor section:

    "accessories": [
        {
            "accessory": "homebridge-dmxplugin",
            "name": "DMX Lamp White",
            "interval": 500,
            "type": "WWCW",
            "x": 1,
            "ww": 7,
            "ww2": 100,
            "cw": 6
        },
        {
            "accessory": "homebridge-dmxplugin",
            "name": "DMX Lamp RGBA",
            "interval": 500,
            "type": "RGBA",
            "x": 1,
            "r": 3,
            "g": 4,
            "b": 5,
            "a": 8
        },
        {
            "accessory": "homebridge-dmxplugin",
            "name": "DMX Lamp UV",
            "interval": 500,
            "type": "W",
            "x": 1,
            "w": 9
        },
        {
            "accessory": "homebridge-dmxplugin",
            "name": "Eurolite Spot",
            "interval": 500,
            "type": "RGB",
            "x": 17,
            "r": 14,
            "g": 15,
            "b": 16
        }
    ],
    
    
Explanation: 
| Config Key   | Description                                                                             | Examples                                                                                             | Required?                                                                 |
|--------------|-----------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| accessory    | always homebridge-dmxplugin                                                             |                                                                                                      | Yes, by homebridge                                                        |
| name         | your name for the device that'll show up in homebridge                                  |                                                                                                      | yes                                                                       |
| type         | The type of your DMX light.                                                             | W (single dimmer or white for halogen lamps), WWCW (Warm white + cold white), RGB, RGBA, RGBW, RGBWA | yes                                                                       |
| interval     | The interval in which the plugin checks for new data (for example a color change) in ms | 500(0.5s), 1000 (1s), 3000 (3s, default)                                                             | optional                                                                  |
| dmx-cli-path | Path of your dmx-cli installation.                                                      | /home/homebridge                                                                                     | yes                                                                       |
| x / x2       | The DMX channel(s) that is(are) always set to max (255/100%)                            | The dimmer channel of your 4ch light, for example 4                                                  | optional                                                                  |
| w / w2       | The DMX channel(s) of your light for controlling white                                  | if your start adress is 5 and it's a simple dimmer, it's 5                                           | required with types W, RGBW, RGBWA, else ignored (use ww(2)/cw(2) instead |
| ww / ww2     | The DMX channel(s) of your light for controlling warm white                             |                                                                                                      | required with type WWCW, else ignored (use w/w2 instead)                  |
| cw / cw2     | The DMX channel(s) of your light for controlling cold white                             |                                                                                                      | required with type WWCW, else ignored (use w/w2 instead)                  |
| r / r2       | The DMX channel(s) of your light for controlling red                                    |                                                                                                      | required with types RGB, RGBW, RGBA, RGBWA                                |
| g / g2       | The DMX channel(s) of your light for controlling green                                  |                                                                                                      | required with types RGB, RGBW, RGBA, RGBWA                                |
| b / b2       | The DMX channel(s) of your light for controlling blue                                   |                                                                                                      | required with types RGB, RGBW, RGBA, RGBWA                                |
| a / a2       | The DMX channel(s) of your light for controlling amber                                  |                                                                                                      | required with types RGBA, RGBWA                                           |
|              |                                                                                         |                                                                                                      |                                                                           |

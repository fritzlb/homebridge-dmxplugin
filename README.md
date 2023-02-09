# homebridge-dmxplugin
Control your DMX lights using homebridge. Supports single channel dimmer lights (W), RGB, RGB+Amber (RGBA), RGBW, RGBWA and Temperature White lights with cold and warm white LEDs (WWCW). Each light can have up to two channels per color and up to two dimmer/shutter/... channels that are always set to 255 (or 100%).


# setup
Install using homebridge-config-ui. At the moment, only works out of the box if homebridge is installed in default paths on linux. 
Setup on Raspberry Pi 4/400:

- add dtoverlay=uart3 to /boot/config.txt
- if not already installed, install homebridge using apt (https://github.com/homebridge/homebridge/wiki/Install-Homebridge-on-Debian-or-Ubuntu-Linux)
- log into homebridge config ui and install this plugin (search for homebridge-dmxplugin)
- connect a max485 to TX of UART3 on the GPIO header of the pi and to a DMX cable or socket
- config your DMX lights using the explanation below 
- if you see messages like "Serial not available" or "It seems like the server application isn't running" you probably didn't reboot after changing /boot/config.txt
- if you get errors like "file not found" your paths are incorrect. Get a fresh copy of dmx-cli (https://github.com/fritzlb/dmx-cli) and copy it to /var/lib/homebridge/node_modules/homebridge-dmxplugin/dmx-cli. Then reboot.
- you can ignore messages like "This server application seems to be already running". Every DMX light you configure tries to start the server but the server can only start once. Also, when restarting homebridge it stays alive.
- if you are encountering performance issues on low powered hardware, you should set "interval" to something higher or reduce the number of lamps in config.json.


# Example config:
(Accessory section)

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
    
    
# Explanation: 
| Config Key   | Description                                                                             | Examples                                                                                             | Required?                                                                 |
|--------------|-----------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| accessory    | always homebridge-dmxplugin                                                             |                                                                                                      | Yes, by homebridge                                                        |
| name         | your name for the device that'll show up in homebridge                                  |                                                                                                      | yes                                                                       |
| type         | The type of your DMX light.                                                             | W (single dimmer or white for halogen lamps), WWCW (Warm white + cold white), RGB, RGBA, RGBW, RGBWA | yes                                                                       |
| interval     | The interval in which the plugin checks for new data (for example a color change) in ms | 500(0.5s), 1000 (1s), 3000 (3s, default)                                                             | optional                                                                  |
| dmx-cli-path | Path of your dmx-cli installation. Not implemented yet                                  | /var/lib/homebridge/node_modules/homebridge-dmxplugin/dmx-cli                                                                                       | yes                                                                       |
| x / x2       | The DMX channel(s) that is(are) always set to max (255/100%)                            | The dimmer channel of your 4ch light, for example 4                                                  | optional                                                                  |
| w / w2       | The DMX channel(s) of your light for controlling white                                  | if your start adress is 5 and it's a simple dimmer, it's 5                                           | required with types W, RGBW, RGBWA, else ignored (use ww(2)/cw(2) instead |
| ww / ww2     | The DMX channel(s) of your light for controlling warm white                             |                                                                                                      | required with type WWCW, else ignored (use w/w2 instead)                  |
| cw / cw2     | The DMX channel(s) of your light for controlling cold white                             |                                                                                                      | required with type WWCW, else ignored (use w/w2 instead)                  |
| r / r2       | The DMX channel(s) of your light for controlling red                                    |                                                                                                      | required with types RGB, RGBW, RGBA, RGBWA                                |
| g / g2       | The DMX channel(s) of your light for controlling green                                  |                                                                                                      | required with types RGB, RGBW, RGBA, RGBWA                                |
| b / b2       | The DMX channel(s) of your light for controlling blue                                   |                                                                                                      | required with types RGB, RGBW, RGBA, RGBWA                                |
| a / a2       | The DMX channel(s) of your light for controlling amber                                  |                                                                                                      | required with types RGBA, RGBWA                                           |
|              |                                                                                         |                                                                                                      |                                                                           |


Note that white and amber channels are being automatically generated and depending on your setup colors could look weird. In that case simply add two accessories, one for RGB and another for amber or white (or even UV (or lime if you're owning those expensive ETC colorsource lights)).

# Contributing
If you encounter any issues, either fix them and create a pr or simply create an issue with a detailed description of your finds. For feature requests please create an issue first (before creating a pr).

# info
And how does this plugin work? Every time an accessory you configured loads, it tries to start dmx-server.py, a small python script designed to open a serial port and output dmx compliant data. If you change anything with your configured lamps inside the home app, this plugin executes dmx-cli.py which updates the dmx values that are being sent by dmx-server.py. Not very elegant, I know. But it works.

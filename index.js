module.exports = (api) => {
  api.registerAccessory('homebridge-dmxplugin', DMXLamp);
}


class DMXLamp {

  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    this.name = config.name;
    this.type = config.type;
    this.log.debug('homebridge-dmxplugin loaded.');

    // your accessory must have an AccessoryInformation service
    this.informationService = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.Characteristic.Manufacturer, "FRITZLB")
      .setCharacteristic(this.Characteristic.Model, "DMX Plugin")
      .setCharacteristic(this.Characteristic.Name, "DMX Lampe");


    // new Lightbulb service RGB(WA)
    this.lightService = new this.Service.Lightbulb(this.name + this.type);
    // On/Off, Brightness, Hue, Saturation
    this.lightService.getCharacteristic(this.Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));
    this.lightService.getCharacteristic(this.Characteristic.Brightness)
      .onGet(this.getBrightness.bind(this))
      .onSet(this.setBrightness.bind(this));

    if (this.type == "RGB" || this.type == "RGBW" || this.type == "RGBWA" || this.type == "RGBA") {

      this.lightService.getCharacteristic(this.Characteristic.Hue)
        .onGet(this.getHue.bind(this))
        .onSet(this.setHue.bind(this));
      this.lightService.getCharacteristic(this.Characteristic.Saturation)
        .onGet(this.getSaturation.bind(this))
        .onSet(this.setSaturation.bind(this));
    }
    else if (this.type == "WWCW") {
      this.lightService.getCharacteristic(this.Characteristic.ColorTemperature)
        .onGet(this.getTemperature.bind(this))
        .onSet(this.setTemperature.bind(this));
    }

    //bei type=W muss nichts extra eingerichtet werden, da der Dimmer immer da ist

    this.OnStatus = true;
    this.BrightnessPercentage = 100;
    this.HueDegrees = 0;
    this.SaturationPercentage = 0;

    this.Temperature = 500;


    //DMX-Data:
    this.red = 0;
    this.green = 0;
    this.blue = 0;
    this.white = 0;
    this.cwhite = 0;
    this.wwhite = 0;
    this.amber = 0;



    this.command = "clear"; //preventing crash before command exists
    this.command_LOCK = false;
    this.command_OLD = "clear";

    this.convertToDMXCommand();

    //DMX Server plus senden
    const { exec } = require("child_process");
    exec("/home/frederik/dmx-server.py", (err, stdout, stderr) => { //start the server if it's not running
      //this.log.debug(stdout);
    });
    let interval = 2000;
    if (config.interval != undefined) interval = config.interval;
    this.sendInterval = setInterval(this.convertToRGBxxAndSend, interval, this);
  }

  /**
   * REQUIRED - This must return an array of the services you want to expose.
   * This method must be named "getServices".
   */
  getServices() {
    return [
      this.informationService,
      this.lightService,
    ];
  }

  async getOn() { //for Color
    return this.OnStatus;
  }

  async setOn(value) { //for Color
    if (value == false) {
      this.BrightnessPercentage = 0;
    }
    if (value == true && this.OnStatus == false) {
      this.BrightnessPercentage = 100;
    }
    this.OnStatus = value;
    this.convertToDMXCommand();
  }

  async getBrightness() {
    return this.BrightnessPercentage;
  }

  async setBrightness(percentage) {
    this.BrightnessPercentage = percentage;
    this.convertToDMXCommand();
  }

  async getHue() {
    return this.HueDegrees;
  }

  async setHue(newHue) {
    this.HueDegrees = newHue;
    this.convertToDMXCommand();
  }

  async getSaturation() {
    return this.SaturationPercentage;
  }

  async setSaturation(newPercentage) {
    this.SaturationPercentage = newPercentage;
    this.convertToDMXCommand();
  }

  async getTemperature() {
    return this.Temperature;
  }

  async setTemperature(newTemp) {
    this.Temperature = newTemp;
    this.convertToDMXCommand();
  }

  HSVtoRGB(h, s, v) {
      let r, g, b, i, f, p, q, t;
      i = Math.floor(h * 6);
      f = h * 6 - i;
      p = v * (1 - s);
      q = v * (1 - f * s);
      t = v * (1 - (1 - f) * s);
      switch (i % 6) {
          case 0: r = v, g = t, b = p; break;
          case 1: r = q, g = v, b = p; break;
          case 2: r = p, g = v, b = t; break;
          case 3: r = p, g = q, b = v; break;
          case 4: r = t, g = p, b = v; break;
          case 5: r = v, g = p, b = q; break;
      }
      return {
          'r': Math.round(r * 255),
          'g': Math.round(g * 255),
          'b': Math.round(b * 255)
      };
  }

  HSVtoRGBW(h, s, v) {
      let r, g, b, w,i, f, q, t;
      w = v * (1 - s); //Gegenteil der Sättigung mit Helligkeit multiplizieren
      i = Math.floor(h * 6);
      f = h * 6 - i;
      q = v * (1 - f * s);
      t = v * (1 - (1 - f) * s);
      switch (i % 6) {
          case 0: r = v*s, g = t*s, b = 0; break; //Alle Werte mit Sättigung multiplizieren
          case 1: r = q*s, g = v*s, b = 0; break;
          case 2: r = 0, g = v*s, b = t*s; break;
          case 3: r = 0, g = q*s, b = v*s; break;
          case 4: r = t*s, g = 0, b = v*s; break;
          case 5: r = v*s, g = 0, b = q*s; break;
      }
      return {
          'r': Math.round(r * 255),
          'g': Math.round(g * 255),
          'b': Math.round(b * 255),
          'w': Math.round(w * 255)
      };
  }

  async convertToDMXCommand() {
    let H = this.HueDegrees/360.0;
    let V = this.BrightnessPercentage/100.0;
    let S = this.SaturationPercentage/100.0;
    
    switch (this.type) {
      case "RGB": {
        const rgbColor = this.HSVtoRGB(H, S, V);
        this.red = rgbColor.r;
        this.green = rgbColor.g;
        this.blue = rgbColor.b;
        break;
      }
      case "RGBA": {
        const rgbColor = this.HSVtoRGB(H, S, V);
        this.red = rgbColor.r;
        this.green = rgbColor.g;
        this.blue = rgbColor.b;
        this.amber = Math.round(Math.min(this.red, this.green));
        break;
      }
      case "RGBW": {
        const rgbwColor = this.HSVtoRGBW(H, S, V);
        this.red = rgbwColor.r;
        this.green = rgbwColor.g;
        this.blue = rgbwColor.b;
        this.white = rgbwColor.w;
        break;
      }
      case "RGBWA": {
        const rgbwColor = this.HSVtoRGBW(H, S, V);
        this.red = rgbwColor.r;
        this.green = rgbwColor.g;
        this.blue = rgbwColor.b;
        this.white = rgbwColor.w;
        this.amber = Math.round(Math.min(this.red, this.green));
        break;
      }
      case "WWCW": {
        let tempvar = (this.Temperature - 140) / 360;
        if (tempvar < 0.5) {
          this.cwhite = Math.round(V * 255);
          this.wwhite = Math.round(V * 255 * 2 * tempvar);
        }
        else {
          this.wwhite = Math.round(V * 255);
          this.cwhite = Math.round(V * 255 * 2 * (1 - tempvar));
        }
        break;
      }
      case "W": {
        this.white = Math.round(V * 255);
        break;
      }
    }
    
    while (this.command_LOCK);
    
    this.command_LOCK = true;
    
    this.command = "/home/frederik/dmx-cli.py";
    
    if (this.config.x != undefined) { //always on
      this.command = this.command + " -" + this.config.x.toString() + " 255";
    }
    if (this.config.x2 != undefined) {
      this.command = this.command + " -" + this.config.x2.toString() + " 255";
    }

    if (this.config.ww != undefined) { //warm white (for WWCW config type)
      this.command = this.command + " -" + this.config.ww.toString() + " " + this.wwhite.toString();
    }
    if (this.config.ww2 != undefined) {
      this.command = this.command + " -" + this.config.ww2.toString() + " " + this.wwhite.toString();
    }

    if (this.config.cw != undefined) { //cold white (for WWCW config type)
      this.command = this.command + " -" + this.config.cw.toString() + " " + this.cwhite.toString();
    }
    if (this.config.cw2 != undefined) {
      this.command = this.command + " -" + this.config.cw2.toString() + " " + this.cwhite.toString();
    }

    if (this.config.r != undefined) { //red
      this.command = this.command + " -" + this.config.r.toString() + " " + this.red.toString();
    }
    if (this.config.r2 != undefined) {
      this.command = this.command + " -" + this.config.r2.toString() + " " + this.red.toString();
    }

    if (this.config.g != undefined) { //green
      this.command = this.command + " -" + this.config.g.toString() + " " + this.green.toString();
    }
    if (this.config.g2 != undefined) {
      this.command = this.command + " -" + this.config.g2.toString() + " " + this.green.toString();
    }

    if (this.config.b != undefined) { //blue
      this.command = this.command + " -" + this.config.b.toString() + " " + this.blue.toString();
    }
    if (this.config.b2 != undefined) {
      this.command = this.command + " -" + this.config.b2.toString() + " " + this.blue.toString();
    }

    if (this.config.w != undefined) { //white (for W and RGB(A)W config types)
      this.command = this.command + " -" + this.config.w.toString() + " " + this.white.toString();
    }
    if (this.config.w2 != undefined) {
      this.command = this.command + " -" + this.config.w2.toString() + " " + this.white.toString();
    }

    if (this.config.a != undefined) {
      this.command = this.command + " -" + this.config.a.toString() + " " + this.amber.toString();
    }
    if (this.config.a2 != undefined) {
      this.command = this.command + " -" + this.config.a2.toString() + " " + this.amber.toString();
    }
    
    this.command_LOCK = false;
    
  }

  async convertToRGBxxAndSend(obj) {
    const { exec } = require("child_process");
    while (obj.command_LOCK);
    if (obj.command != obj.command_OLD) {
      obj.command_OLD = obj.command;
      obj.log.debug(obj.command);
      exec(obj.command, (err, stdout, stderr) => {
        if (stdout.length > 5) {
          obj.log.debug(stdout);
        }
      });
    }
    
 


  }
}

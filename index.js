/**
 * To test the plugin
 * - install the plugin (for example with npm link)
 * - activate the plugin
 * - add an UDP NMEA0183 connection to the server
 * - send data via udp
 *     echo '$IIXXX,1,2,3,foobar,D*17' | nc -u -w 0 127.0.0.1 7777
 */
const utils = require('@signalk/nmea0183-utilities')

module.exports = function (app) {
  const plugin = {}
  plugin.id = plugin.name = plugin.description = 'signalk-quectel-proprietary-sentence-plugin'

  plugin.start = function (options) {
    // Sentence: $PQTMTAR 
    // $PQTMTAR,1,124907.000,6,,1.729,-1.316205,-0.713165,84.344437,0.146003,0.296450,0.045169,00*55
    let headingOffset = options.headingOffset;
    app.emitPropertyValue('nmea0183sentenceParser', {
      sentence: 'PQTMTAR',
      parser: ({ id, sentence, parts, tags }, session) => {
        let value
        value = utils.float(parts[7]) + headingOffset; //NOTE For some reason Quectel orientation need to be rotated +90deg
        if (value >= 360) {
          value = value - 360
        }
        return {
          updates: [
            {
              source: {
                talker: 'PQTMTAR',
                sentence: 'PQTMTAR'
              },
              values: [
                { path: 'navigation.headingTrue', value: utils.transform(value, 'deg', 'rad')},
                { path: 'sensors.heading.lc02h.antennaDist', value: utils.float(parts[4])},
                { path: 'sensors.heading.lc02h.rtkStatus', value: utils.int(parts[2]) },
              ]

            }
          ]
        }
      }
    })
  }

  plugin.stop = function () { }
  plugin.schema = {
    type: 'object',
    properties: {
      headingOffset: {
        type: 'integer',
        default: 0,
        title: 'Heading offset in degrees',
      },
    },
  }
  return plugin
}

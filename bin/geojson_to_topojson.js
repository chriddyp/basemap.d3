var fs = require('fs'),
    topojson  = require('topojson'),
    ProgressBar = require('progress');

fs.readFile('./bin/config.json', 'utf8', main);

function main(err, configFile) {
    if (err) throw err;

    var config = JSON.parse(configFile);

    var barWrite = new ProgressBar(
        'Writing into topojson: [:bar] :current/:total :etas',
        {
            incomplete: ' ',
            total: config.resolutions.length
        }
    );

    function fn(r, v, ext) {
        return v.name + '_' + r + 'm.' + ext;
    }

    function out(r) {
        return 'world_' + r + 'm.json';
    }

    // TODO could do better
    function id(d) {
        var p = d.properties;
        return (p.iso_a3 || p.ISO_A3) || (p.postal);
    }

    config.resolutions.forEach(function(r) {
        var collections = {};

        var barRead = new ProgressBar(
            'Processing GeoJSON files : [:bar] :current/:total :etas',
            {
                incomplete: ' ',
                total: config.vectors.length
            }
        );

        config.vectors.forEach(function(v) {
            var d = fs.readFileSync(config.wget_dir + fn(r, v, 'json'), 'utf8');
            collections[v.name] = JSON.parse(d);
            barRead.tick();
        });

        var topology = topojson.topology(collections, {
            'verbose': true,
            'id': id
        });

        fs.writeFile(config.out_dir + out(r), JSON.stringify(topology), function(err){
            if (!err) barWrite.tick();
        });

    });

}
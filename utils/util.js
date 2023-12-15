const os = require('os');

const util = {
    getIpv4: () => {
        const netInterface = os.networkInterfaces();

        for(const interface of Object.keys(netInterface)) {
            for(const subInterface of netInterface[interface]) {
                if(subInterface['family'] === 'IPv4') {
                   return subInterface['address'];
                }
            }
        }

        return '';
    }
}

module.exports = util;
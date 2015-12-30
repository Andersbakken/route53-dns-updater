#!/usr/bin/env node

/*global require, setInterval, process, module, exports*/
'use strict';
var superagent = require('superagent');
var aws = require('aws-sdk');
var safe = require('safetydance');
var commander = require('commander');

var route53;

function zoneId(domain, cb) {
    route53.listHostedZonesByName({ DNSName: domain }, function(err, data) {
        if (err) {
            cb(err);
            return;
        }
        var id = safe.query(data, 'HostedZones[0].Id');
        // console.log(data);
        if (!id) {
            cb(new Error('Id not found ' + safe.error));
            return;
        }
        cb(undefined, id);
    });
}

function setIp(hostedZoneId, domain, cb) {
    superagent.get('http://ipinfo.io/ip', function(error, result) {
        if (error) {
            cb(error);
            return;
        }

        var ip = result.text.trim();

        var params = {
            'HostedZoneId': hostedZoneId,
            'ChangeBatch': {
                'Changes': [ {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': domain,
                        'Type': 'A',
                        'TTL': 86400,
                        'ResourceRecords': [ { 'Value': ip } ]
                    }
                } ]
            }
        };

        route53.changeResourceRecordSets(params, cb);
    });
}

function update(params, cb)
{
    route53 = new aws.Route53(params);
    zoneId(params.domain, function(err, id) {
        if (err) {
            cb(err);
        } else {
            setIp(id, params.domain, cb);
        }
    });
}

if (require.main === module) {
    commander
        .version('0.0.1')
        .option('-d, --domain-name [arg]', 'Domain name for route53')
        .option('-r, --region [arg]', 'Region for route53 (default us-west-1)', 'us-west-1')
        .option('-a, --access-key-id [arg]', 'Access key for route53')
        .option('-s, --secret-access-key [arg]', 'Secret access key for route53')
        .parse(process.argv);
    var params = {
        domain: commander.domainName || process.env.DOMAIN_NAME,
        accessKeyId: commander.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: commander.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
        region: commander.region || process.env.AWS_REGION
    };
    // console.log(params);
    for (var key in params) {
        if (!params[key]) {
            commander.outputHelp();
            console.error('Missing ' + key);
            process.exit(1);
        }
    }
    update(params, function(err) {
        if (err)
            console.error(err);
        process.exit(err ? 3 : 0);
    });
}

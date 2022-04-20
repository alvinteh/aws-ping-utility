const ping = require('ping');
const { DescribeRegionsCommand, EC2Client } = require('@aws-sdk/client-ec2');

(async () => {
    // Retrieve regions (note, the region specified is not actually used)
    const ec2Client = new EC2Client({ region: 'us-east-1' });
    const rawRegions = await ec2Client.send(new DescribeRegionsCommand({ AllRegions: true }));

    const regions = rawRegions.Regions.map((rawRegion) => {
        return rawRegion.RegionName;
    });

    console.log(`Completed retrieving list of regions`);

    // Ping each region
    let results = [];
    let promises = [];

    for (const region of regions) {
        const endpoint = `s3.${region}.amazonaws.com`;
        const promise = ping.promise.probe(endpoint, { timeout: 5 });
        promise.then((result) => {
            console.log(`Completed pinging ${region}`);
            results.push({
                region,
                latency: parseFloat(result.avg)
            });
        })
        .catch((error) => {
            console.log(`Error pinging ${region}: ${error.message}`);
        });

        promises.push(promise);
    }

    // Wait for promises to be resolved
    await Promise.all(promises);

    // Sort results by latency
    results = results.sort((a, b) => { return a.latency > b.latency });

    // Display results
    console.log(`Completed pinging ${regions.length} regions`);
    console.log(results);
})();
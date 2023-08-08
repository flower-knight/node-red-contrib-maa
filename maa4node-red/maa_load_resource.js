module.exports = function (RED) {
    function LoadResourceNode(config) {
        RED.nodes.createNode(this, config);
        let maaPath = config.maaPath
        let node = this;

        node.on("input", function (msg, send, done) {
            send = send || function () {
                node.send.apply(node, arguments)
            };
            msg.payload = maaPath;
            send(msg);
            // status = { fill: "green", shape: "dot", text: RED._("mysql.status.ok") };
            // node.status(status);
        })
    }

    RED.nodes.registerType("load_resource", LoadResourceNode, {
        defaults: {
            maaPath: {value: ""},
        }
    });
}

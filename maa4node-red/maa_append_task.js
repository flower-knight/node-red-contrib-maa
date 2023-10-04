module.exports = function (RED) {
    function AppendTaskNode(config) {
        RED.nodes.createNode(this, config);
        let uuid = config.uuid;
        let type = config.type;
        let node = this;

        node.on("input", function (msg, send, done) {
            send = send || function () {
                node.send.apply(node, arguments)
            };
            msg.topic = "AppendTask"
            msg.payload = {
                uuid: uuid,
                type: type
            };
            send(msg);
            // status = { fill: "green", shape: "dot", text: RED._("mysql.status.ok") };
            // node.status(status);
        })
    }

    RED.nodes.registerType("append_task", AppendTaskNode, {
        defaults: {
            type: {value: ""},
            name: {value: ""}
        }
    });
}

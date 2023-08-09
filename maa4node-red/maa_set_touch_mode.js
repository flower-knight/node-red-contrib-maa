module.exports = function (RED) {
    function SetTouchModeNode(config) {
        RED.nodes.createNode(this, config);
        let uuid = config.uuid;
        let touchMode = config.touchMode;
        let node = this;

        node.on("input", function (msg, send, done) {
            send = send || function () {
                node.send.apply(node, arguments)
            };
            msg.topic = "SetTouchMode"
            msg.payload = {
                uuid: uuid,
                touchMode: touchMode
            };
            send(msg);
            // status = { fill: "green", shape: "dot", text: RED._("mysql.status.ok") };
            // node.status(status);
        })
    }

    RED.nodes.registerType("set_touch_mode", SetTouchModeNode, {
        defaults: {
            maaPath: {value: ""},
            name: {value: ""}
        }
    });
}

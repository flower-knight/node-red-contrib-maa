module.exports = function (RED) {
    function SetTouchModeNode(config) {
        RED.nodes.createNode(this, config);
        let touchMode = config.touchMode;
        let node = this;

        node.on("input", function (msg, send, done) {
            send = send || function () {
                node.send.apply(node, arguments)
            };
            let uuid = msg.payload;
            msg.topic = "SetTouchMode";
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
            touchMode: {value: "maatouch"},
            name: {value: ""}
        }
    });
}

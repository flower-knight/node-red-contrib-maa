module.exports = function (RED) {
    function LoadResourceNode(config) {

    }
    RED.nodes.registerType("load_resource", LoadResourceNode,{
        defaults: {
            maaPath: {value: ""},
        }
    });
}

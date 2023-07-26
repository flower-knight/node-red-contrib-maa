const ffi = require("@tigerconnect/ffi-napi")
const ref = require("@tigerconnect/ref-napi")
const path = require("path");
const callbackHandle = require("./callback")
/*import ffi, {DynamicLibrary} from "@tigerconnect/ffi-napi";
import ref from "@tigerconnect/ref-napi"
import * as path from "path";
import callbackHandle from './callback'
// import { InstanceOptionKey } from '@main/../common/enum/core'
import {InstanceOptionKey} from './settings'
import {TouchMode} from './settings'*/

/** Some types for core */
const BoolType = ref.types.bool
const IntType = ref.types.int
const AsstAsyncCallIdType = ref.types.int
// const AsstBoolType = ref.types.uint8
// const IntArrayType = ArrayType(IntType)
// const DoubleType = ref.types.double
const ULLType = ref.types.ulonglong
const VoidType = ref.types.void
const StringType = ref.types.CString
// const StringPtrType = ref.refType(StringType)
// const StringPtrArrayType = ArrayType(StringType)
const AsstType = ref.types.void
const AsstPtrType = ref.refType(AsstType)
// const TaskPtrType = ref.refType(AsstType)
const CustomArgsType = ref.refType(ref.types.void)
const IntPointerType = ref.refType(IntType)
const Buff = CustomArgsType

function createVoidPointer() {
    return ref.alloc(ref.types.void)
}


module.exports = function (RED) {
    var reconnect = RED.settings.maaReconnectTime || 20000;

    function MaaNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        this.adbPath = config.adbPath
        this.maaPath = config.maaPath
        // this.host = config.host
        this.libPath = config.libPath
        this.DepLibs = []
        this.MeoAsstPtr = {}
        this.connecting = false;
        this.connected = false;
        this.dependences = {
            win32: [
                'opencv_world4_maa.dll',
                'onnxruntime_maa.dll',
                'MaaDerpLearning.dll'
            ],
            linux: [
                'libiomp5.so',
                'libmklml_intel.so',
                'libmkldnn.so'
            ],
            darwin: ['libpaddle_inference.dylib']
        }
        this.libName = {
            win32: 'MaaCore.dll',
            darwin: 'MeoAssistant.dylib',
            linux: 'libMeoAssistant.so'
        }


        function load() {
            try {
                node.connecting = true;
                node.emit("state", "connecting")
                node.dependences[process.platform].forEach((lib) => {
                    node.DepLibs.push(ffi.DynamicLibrary(path.join(node.libPath, lib)))
                })
                node.DLib = ffi.DynamicLibrary(path.join(node.libPath, node.libName[process.platform]), ffi.RTLD_NOW)
                node.MeoAsstLib = {
                    AsstSetUserDir: ffi.ForeignFunction(node.DLib.get('AsstSetUserDir'),
                        BoolType,
                        [StringType],
                        ffi.FFI_STDCALL),

                    AsstLoadResource: ffi.ForeignFunction(node.DLib.get('AsstLoadResource'),
                        BoolType,
                        [StringType],
                        ffi.FFI_STDCALL),

                    AsstSetStaticOption: ffi.ForeignFunction(node.DLib.get('AsstSetStaticOption'),
                        BoolType,
                        [IntType, StringType],
                        ffi.FFI_STDCALL),

                    AsstCreate: ffi.ForeignFunction(node.DLib.get('AsstCreate'),
                        AsstPtrType,
                        [],
                        ffi.FFI_STDCALL),

                    AsstCreateEx: ffi.ForeignFunction(node.DLib.get('AsstCreateEx'),
                        AsstPtrType,
                        ['pointer', CustomArgsType],
                        ffi.FFI_STDCALL),

                    AsstDestroy: ffi.ForeignFunction(node.DLib.get('AsstDestroy'),
                        VoidType,
                        [AsstPtrType],
                        ffi.FFI_STDCALL),

                    AsstSetInstanceOption: ffi.ForeignFunction(node.DLib.get('AsstSetInstanceOption'),
                        BoolType,
                        [AsstPtrType, IntType, StringType],
                        ffi.FFI_STDCALL),

                    AsstConnect: ffi.ForeignFunction(node.DLib.get('AsstConnect'),
                        BoolType,
                        [AsstPtrType, StringType, StringType, StringType],
                        ffi.FFI_STDCALL),

                    AsstAppendTask: ffi.ForeignFunction(node.DLib.get('AsstAppendTask'),
                        IntType,
                        [AsstPtrType, StringType, StringType],
                        ffi.FFI_STDCALL),

                    AsstSetTaskParams: ffi.ForeignFunction(node.DLib.get('AsstSetTaskParams'),
                        BoolType,
                        [AsstPtrType, IntType, StringType],
                        ffi.FFI_STDCALL),

                    AsstStart: ffi.ForeignFunction(node.DLib.get('AsstStart'),
                        BoolType,
                        [AsstPtrType],
                        ffi.FFI_STDCALL),

                    AsstStop: ffi.ForeignFunction(node.DLib.get('AsstStop'),
                        BoolType,
                        [AsstPtrType],
                        ffi.FFI_STDCALL),

                    AsstRunning: ffi.ForeignFunction(node.DLib.get('AsstRunning'),
                        BoolType,
                        [AsstPtrType],
                        ffi.FFI_STDCALL),

                    AsstAsyncConnect: ffi.ForeignFunction(node.DLib.get('AsstAsyncConnect'),
                        AsstAsyncCallIdType,
                        [AsstPtrType, StringType, StringType, StringType, BoolType],
                        ffi.FFI_STDCALL),

                    AsstAsyncClick: ffi.ForeignFunction(node.DLib.get('AsstAsyncClick'),
                        AsstAsyncCallIdType,
                        [AsstPtrType, IntType, IntType, BoolType],
                        ffi.FFI_STDCALL),

                    AsstAsyncScreenCap: ffi.ForeignFunction(node.DLib.get('AsstAsyncScreencap'),
                        AsstAsyncCallIdType,
                        [AsstPtrType, BoolType],
                        ffi.FFI_STDCALL),

                    AsstGetImage: ffi.ForeignFunction(node.DLib.get('AsstGetImage'),
                        ULLType,
                        [AsstPtrType, Buff, ULLType],
                        ffi.FFI_STDCALL),

                    AsstGetUUID: ffi.ForeignFunction(node.DLib.get('AsstGetUUID'),
                        ULLType,
                        [AsstPtrType, StringType, ULLType],
                        ffi.FFI_STDCALL),

                    AsstGetTasksList: ffi.ForeignFunction(node.DLib.get('AsstGetTasksList'),
                        ULLType,
                        [AsstPtrType, IntPointerType, ULLType],
                        ffi.FFI_STDCALL),

                    AsstGetNullSize: ffi.ForeignFunction(node.DLib.get('AsstGetNullSize'),
                        ULLType,
                        [],
                        ffi.FFI_STDCALL),

                    AsstGetVersion: ffi.ForeignFunction(node.DLib.get('AsstGetVersion'),
                        StringType,
                        [],
                        ffi.FFI_STDCALL),

                    AsstLog: ffi.ForeignFunction(node.DLib.get('AsstLog'),
                        VoidType,
                        [StringType, StringType],
                        ffi.FFI_STDCALL)
                }
                const version = GetCoreVersion()
                if (version) {
                    node.error("maaCore connect failed")
                    node.status({fill: "red", shape: "ring", text: RED._("maaCore.status.badping")});
                    node.tick = setTimeout(load, reconnect)
                } else {
                    node.connected = true;
                    node.emit("state", "connected");
                    if (!node.check) {
                        node.check = setInterval(version, 290000);
                    }
                }
            } catch (err) {
                node.error(err)
                node.status({fill: "red", shape: "ring", text: RED._("maaCore.status.badping")});
                // node.dispose()
            }
        }

        node.connect = function () {
            if (!node.connected && !node.connecting) {
                load();
            }
        }

        node.on('close', function (done) {
            if (node.tick) {
                clearTimeout(node.tick);
            }
            if (node.check) {
                clearInterval(node.check);
            }
            // node.connection.release();
            node.emit("state", " ");
            if (node.connected) {
                node.connected = false;
                Destroy();
                done();
            } else {
                Destroy();
                done();
            }

        });

        /**
         * 指定资源路径
         * @param path? 未指定就用libPath
         * @returns
         */
        function LoadResource(path) {
            return node.MeoAsstLib.AsstLoadResource(path ?? node.libPath)
        }

        /**
         * 创建普通实例, 即无回调版
         * @returns 实例指针{ref.Pointer}
         */
        function Create() {
            node.MeoAsstPtr.placeholder = node.MeoAsstLib.AsstCreate()
            return !!node.MeoAsstPtr.placeholder
        }

        /**
         * @description 创建实例
         * @param uuid 设备唯一标识符
         * @param callback 回调函数
         * @param customArg 自定义参数{???}
         * @returns  是否创建成功
         */
        function CreateEx(
            uuid,
            callback = callbackHandle,
            customArg = createVoidPointer()
        ) {
            if (!node.MeoAsstPtr[uuid]) {
                node.MeoAsstPtr[uuid] = node.MeoAsstLib.AsstCreateEx(callback, customArg)
                return true
            }
            return false // 重复创建
        }

        /**
         * @description 摧毁实例
         * @param uuid 设备唯一标识符
         */
        function Destroy(uuid) {
            if (node.MeoAsstPtr[uuid]) {
                node.MeoAsstLib.AsstDestroy(node.MeoAsstPtr[uuid])
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete node.MeoAsstPtr[uuid]
            }
        }

        /** @deprecated 已废弃，将在接下来的版本中移除 */
        function Connect(address, uuid, adbPath, config) {
            return node.MeoAsstLib.AsstConnect(node.MeoAsstPtr[uuid], adbPath, address, config)
        }

        /**
         * @description 连接
         * @param address 连接地址
         * @param uuid 设备唯一标识符
         * @param adbPath adb路径
         * @param config 模拟器名称, 自定义设备为'General'
         * @param block 是否阻塞
         * @returns 是否连接成功
         */
        function AsyncConnect(address, uuid, adbPath, config, block = false) {
            return node.MeoAsstLib.AsstAsyncConnect(node.MeoAsstPtr[uuid], adbPath, address, config, block)
        }

        /**
         * 添加任务
         * @param uuid 设备唯一标识符
         * @param type 任务类型, 详见文档
         * @param params 任务json字符串, 详见文档
         * @returns
         */
        function AppendTask(uuid, type, params) {
            return node.MeoAsstLib.AsstAppendTask(GetCoreInstanceByUUID(uuid), type, params)
        }

        /**
         * 设置任务参数
         * @param uuid 设备唯一标识符
         * @param taskId 任务唯一id
         * @param params 任务参数
         */

        function SetTaskParams(uuid, taskId, params) {
            return node.MeoAsstLib.AsstSetTaskParams(
                GetCoreInstanceByUUID(uuid),
                taskId,
                params
            )
        }

        /**
         * 开始任务
         * @param uuid 设备唯一标识符
         * @returns 是否成功
         */
        function Start(uuid) {
            return node.MeoAsstLib.AsstStart(GetCoreInstanceByUUID(uuid))
        }

        /**
         * 停止并清空所有任务
         * @param uuid 设备唯一标识符
         * @returns
         */
        function Stop(uuid) {
            return node.MeoAsstLib.AsstStop(GetCoreInstanceByUUID(uuid))
        }

        /**
         * 发送点击
         * @param uuid 设备唯一标识符
         * @param x x坐标
         * @param y y坐标
         * @returns
         */
        function Click(uuid, x, y) {
            return node.MeoAsstLib.AsstClick(GetCoreInstanceByUUID(uuid), x, y)
        }

        /**
         * 异步请求截图, 在回调中取得截图完成事件后再使用GetImage获取截图
         * @param uuid
         * @param block 阻塞
         * @returns
         */
        function AsyncScreenCap(uuid, block = true) {
            if (!node.MeoAsstPtr[uuid]) return false
            return node.MeoAsstLib.AsstAsyncScreenCap(GetCoreInstanceByUUID(uuid), block)
        }

        function GetImage(uuid) {
            const buf = Buffer.alloc(5114514)
            // const len = node.MeoAsstLib.AsstGetImage(GetCoreInstanceByUUID(uuid), buf as any, buf.length)
            // const buf2 = buf.slice(0, len as number)
            const len = node.MeoAsstLib.AsstGetImage(GetCoreInstanceByUUID(uuid), buf, buf.length)
            const buf2 = buf.slice(0, Number(len))
            const v2 = buf2.toString('base64')
            return v2
        }

        /**
         * @description core版本
         * @returns 版本
         */
        function GetCoreVersion() {
            if (!node.connected) return null
            return node.MeoAsstLib.AsstGetVersion()
        }

        function GetCoreInstanceByUUID(uuid) {
            return node.MeoAsstPtr[uuid]
        }

        function Log(level, message) {
            return node.MeoAsstLib.AsstLog(level, message)
        }

        function SetInstanceOption(uuid, key, value) {
            return node.MeoAsstLib.AsstSetInstanceOption(GetCoreInstanceByUUID(uuid), key, value)
        }

        function SetTouchMode(uuid, mode) {
            if (!node.MeoAsstPtr[uuid]) {
                return false
            }
            return SetInstanceOption(uuid, InstanceOptionKey.TouchMode, mode)
        }

        /**
         * @description change touch mode for all instances
         * @param mode TouchMode
         * @returns is all changes success
         */
        function ChangeTouchMode(mode) {
            for (const uuid in node.MeoAsstPtr) {
                if (node.MeoAsstPtr[uuid]) {
                    const status = SetTouchMode(uuid, mode)
                    if (!status) {
                        // logger.error(`Change touch mode failed on uuid: ${uuid}`)
                        return status
                    }
                }
            }
            return true
        }
    }

    RED.nodes.registerType("maaCore", MaaNode, {
        defaults: {
            maaPath: {value: ""},
            adbPath: {value: "127.0.0.1:5555", required: true}
            // port: {value:"5555",required:true}
        }
        // credentials: {
        //     user: {type: "text"},
        //     password: {type: "password"}
        // }
    });

    function MaaNodeIn(config) {
        RED.nodes.createNode(this, config);
        this.maaCore = config.maaCore;
        this.maaCoreConfig = RED.nodes.getNode(this.maaCore);
        this.status({});

        if (this.maaCoreConfig) {
            this.maaCoreConfig.connect();
            var node = this;
            var busy = false;
            var status = {};
            node.maaCoreConfig.on("state", function (info) {
                if (info === "connecting") {
                    node.status({fill: "grey", shape: "ring", text: info});
                } else if (info === "connected") {
                    node.status({fill: "green", shape: "dot", text: info});
                } else {
                    node.status({fill: "red", shape: "ring", text: info});
                }
            });

            node.on("input", function (msg, send, done) {
                send = send || function () {
                    node.send.apply(node, arguments)
                };
                if (node.maaCoreConfig.connected) {
                    if (typeof msg.topic === 'string') {
                        //console.log("query:",msg.topic);
                        node.maaCoreConfig.pool.getConnection(function (err, conn) {
                            if (err) {
                                if (conn) {
                                    conn.release()
                                }
                                status = {
                                    fill: "red",
                                    shape: "ring",
                                    text: RED._("maa.status.error") + ": " + err.code
                                };
                                node.status(status);
                                node.error(err, msg);
                                if (done) {
                                    done();
                                }
                                return
                            }

                            var bind = [];
                            if (Array.isArray(msg.payload)) {
                                bind = msg.payload;
                            } else if (typeof msg.payload === 'object' && msg.payload !== null) {
                                bind = msg.payload;
                            }
                            conn.config.queryFormat = Array.isArray(msg.payload) ? null : customQueryFormat
                            conn.query(msg.topic, bind, function (err, rows) {
                                conn.release()
                                if (err) {
                                    status = {
                                        fill: "red",
                                        shape: "ring",
                                        text: RED._("maa.status.error") + ": " + err.code
                                    };
                                    node.status(status);
                                    node.error(err, msg);
                                } else {
                                    msg.payload = rows;
                                    send(msg);
                                    status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                    node.status(status);
                                }
                                if (done) {
                                    done();
                                }
                            });
                        })

                    } else {
                        if (typeof msg.topic !== 'string') {
                            node.error("msg.topic : " + RED._("maa.errors.notstring"));
                            done();
                        }
                    }
                } else {
                    node.error(RED._("maa.errors.notconnected"), msg);
                    status = {fill: "red", shape: "ring", text: RED._("maa.status.notconnected")};
                    if (done) {
                        done();
                    }
                }
                if (!busy) {
                    busy = true;
                    node.status(status);
                    node.tout = setTimeout(function () {
                        busy = false;
                        node.status(status);
                    }, 500);
                }
            });

            node.on('close', function () {
                if (node.tout) {
                    clearTimeout(node.tout);
                }
                node.maaCoreConfig.removeAllListeners();
                node.status({});
            });
        } else {
            this.error(RED._("maa.errors.notconfigured"));
        }
    }

    RED.nodes.registerType("maa", MaaNodeIn);


}

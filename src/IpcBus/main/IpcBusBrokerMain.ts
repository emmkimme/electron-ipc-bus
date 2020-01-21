import { IpcPacketBuffer } from 'socket-serializer';

import * as Client from '../IpcBusClient';
import { IpcBusCommand } from '../IpcBusCommand';

import { IpcBusBrokerImpl } from '../node/IpcBusBrokerImpl';
import { IpcBusBridgeImpl, IpcBusBridgeClient } from './IpcBusBridgeImpl';

/** @internal */
export class IpcBusBrokerMain extends IpcBusBrokerImpl implements IpcBusBridgeClient {
    private _bridge: IpcBusBridgeImpl;

    constructor(contextType: Client.IpcBusProcessType, bridge: IpcBusBridgeImpl) {
        super(contextType);

        this._bridge = bridge;

        this._subscriptions.emitter = true;
        this._subscriptions.on('channel-added', (channel) => {
            this.bridgeAddChannel(channel);
        });
        this._subscriptions.on('channel-removed', (channel) => {
            this.bridgeRemoveChannel(channel);
        });
    }

    hasChannel(channel: string) {
        return this._subscriptions.hasChannel(channel);
    }

    connect(options: Client.IpcBusClient.ConnectOptions): Promise<void> {
        return super.connect(options)
    }

    close(options?: Client.IpcBusClient.ConnectOptions): Promise<void> {
        return this.close(options);
    }

    broadcastPacketRaw(ipcBusCommand: IpcBusCommand, rawContent: IpcPacketBuffer.RawContent): void {
        this.broadcastBuffer(ipcBusCommand, rawContent.buffer);
    }

    broadcastPacket(ipcBusCommand: IpcBusCommand, ipcPacketBuffer: IpcPacketBuffer): void {
        this.broadcastBuffer(ipcBusCommand, ipcPacketBuffer.buffer);
    }

    broadcastBuffer(ipcBusCommand: IpcBusCommand, buffer?: Buffer): void {
        switch (ipcBusCommand.kind) {
            case IpcBusCommand.Kind.SendMessage:
                this._subscriptions.forEachChannel(ipcBusCommand.channel, (connData) => {
                    connData.conn.write(buffer);
                });
                break;

            case IpcBusCommand.Kind.RequestResponse: {
                this._subscriptions.forEachChannel(ipcBusCommand.channel, (connData) => {
                    connData.conn.write(buffer);
                    this._subscriptions.emitter = false;
                    this._subscriptions.removeChannel(ipcBusCommand.request.replyChannel);
                    this._subscriptions.emitter = true;
                });
                break;
            }

            case IpcBusCommand.Kind.RequestClose:
                this._subscriptions.emitter = false;
                this._subscriptions.removeChannel(ipcBusCommand.request.replyChannel);
                this._subscriptions.emitter = true;
                break;
        }
    }

    protected _reset(closeServer: boolean) {
        super._reset(closeServer);
        this._bridge._onNetClosed();
    }

    protected bridgeBroadcastMessage(ipcBusCommand: IpcBusCommand, ipcPacketBuffer: IpcPacketBuffer) {
        this._bridge._onNetMessageReceived(ipcBusCommand, ipcPacketBuffer);
    }
}

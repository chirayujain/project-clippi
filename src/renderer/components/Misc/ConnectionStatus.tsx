import * as React from "react";

import { ConnectionStatus } from "@vinceau/slp-realtime";
import { Button, Divider, Grid, Card, Header, Image, Input, Segment } from "semantic-ui-react";

import { pulseAnimation } from "@/styles/animations";
import styled, { css } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch, iRootState } from "@/store";

import { dispatcher } from "@/store";
import slippiLogoSVG from "@/styles/images/slippi-logo.svg";
import dolphinLogoSVG from "@/styles/images/dolphin.svg";
import slippiLogo from "@/styles/images/slippi.png";
import { InlineInput } from "./InlineInputs";
import { CustomIcon, Labelled } from "./Misc";
import { streamManager } from "@/lib/realtime";

const statusToLabel = (status: ConnectionStatus): string => {
    switch (status) {
        case ConnectionStatus.DISCONNECTED:
            return "disconnected";
        case ConnectionStatus.CONNECTING:
            return "connecting";
        case ConnectionStatus.CONNECTED:
            return "connected";
        case ConnectionStatus.RECONNECTING:
            return "reconnecting";
        default:
            return "unknown";
    }
};

const statusToClickLabel = (status: ConnectionStatus): string => {
    switch (status) {
        case ConnectionStatus.DISCONNECTED:
            return "Click to connect";
        case ConnectionStatus.CONNECTED:
            return "Click to disconnect";
        default:
            return "";
    }
};

const statusToColor = (status: ConnectionStatus): string => {
    switch (status) {
        case ConnectionStatus.CONNECTED:
            return "#00E461";
        case ConnectionStatus.CONNECTING:
        case ConnectionStatus.RECONNECTING:
            return "#FFB424";
        default:
            return "#F30807";
    }
};

export const ScanningDot: React.FC<{
    color: string;
    shouldPulse?: boolean;
}> = props => {
    const animated = css`
    animation: ${pulseAnimation("6px", props.color)}
    `;
    const InnerScanningDot = styled.span`
        height: 10px;
        width: 10px;
        background-color: ${props.color};
        border-radius: 50%;
        display: inline-block;
        margin-right: 5px;
        ${props.shouldPulse && animated}
    `;
    return (<InnerScanningDot />);

};

export const ConnectionStatusDisplay: React.FC<{
    port: string;
    onPortChange: (port: string) => void;
    onConnectClick: () => void;
    onDisconnectClick: () => void;
    status: ConnectionStatus;
}> = props => {
    const color = statusToColor(props.status);
    const shouldPulse = props.status !== ConnectionStatus.DISCONNECTED;
    const Outer = styled.div`
    padding: 10px 0;
    display: flex;
    `;
    const ConnectInfo = styled.div`
    margin-left: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    `;
    const handleClick = () => {
        switch (props.status) {
            case ConnectionStatus.DISCONNECTED:
                props.onConnectClick();
                return;
            case ConnectionStatus.CONNECTED:
                props.onDisconnectClick();
                return;
        }
    };

    return (
        <Outer>
            <img src={slippiLogo} style={{ height: "35px", width: "35px" }} />
            <ConnectInfo>
                <Labelled title={statusToClickLabel(props.status)} onClick={handleClick} position="right">
                    <Header sub>
                        <ScanningDot shouldPulse={shouldPulse} color={color} /> {statusToLabel(props.status)}
                    </Header>
                </Labelled>
                <span>Relay Port: <InlineInput value={props.port} onChange={props.onPortChange} /></span>
            </ConnectInfo>
        </Outer>
    );
};

export const SlippiConnectionStatusCard: React.FC<{
    port: string;
    status: ConnectionStatus;
    onDisconnect: () => void;
}> = props => {
    const header = statusToLabel(props.status);
    const subHeader = `Relay Port: ${props.port}`;
    const connected = props.status === ConnectionStatus.CONNECTED;
    const statusColor = statusToColor(props.status);
    return (
        <ConnectionStatusCard
            header={header}
            subHeader={subHeader}
            userImage={slippiLogo}
            statusColor={statusColor}
            shouldPulse={connected}
            onDisconnect={props.onDisconnect}
        />
    );
};

export const ConnectionStatusCard: React.FC<{
    userImage: any;
    header: string;
    subHeader: string;
    statusColor?: string;
    shouldPulse?: boolean;
    onDisconnect?: () => void;
}> = props => {
    const handleButtonClick = () => {
        if (props.onDisconnect) {
            props.onDisconnect();
        }
    };
    const color = props.statusColor || "red";
    const StatusSpan = styled.span`
    text-transform: capitalize;
    margin-right: 10px;
    `;
    return (
        <div style={{ padding: "3px" }}>
            <Card>
                <Card.Content>
                    <Image
                        floated="right"
                        size="mini"
                        src={props.userImage}
                    />
                    <Card.Header>
                        <StatusSpan>
                            {props.header}
                        </StatusSpan>
                        <ScanningDot color={color} shouldPulse={props.shouldPulse} />
                    </Card.Header>
                    <Card.Meta>
                        <span>{props.subHeader}</span>
                    </Card.Meta>
                </Card.Content>
                <Card.Content extra>
                    <Button basic fluid color="red" onClick={handleButtonClick}>
                        Disconnect
                    </Button>
                </Card.Content>
            </Card>
        </div>
    );
};

export const SlippiConnectionPlaceholder: React.FC<{
    port: string;
    onClick: (port: string) => void;
}> = props => {
    const { liveSlpFilesPath } = useSelector((state: iRootState) => state.filesystem);
    const dispatch = useDispatch<Dispatch>();
    const selectPath = () => {
        dispatch.filesystem.getLiveSlpFilesPath();
    };
    const [p, setP] = React.useState(props.port);
    const VerticalHeader = styled(Header)`
    &&& {
    display: flex;
    flex-direction: column;
    }
    `;
    return (
        <Segment placeholder>
            <Grid columns={2} stackable textAlign='center'>
                <Divider vertical>Or</Divider>
                <Grid.Row verticalAlign='middle'>
                    <Grid.Column>
                        <VerticalHeader icon>
                            <CustomIcon image={slippiLogoSVG} size={54} color="#353636" />
                            Connect to a Slippi Relay
                        </VerticalHeader>
                        <Input
                            style={{ maxWidth: "initial" }}
                            placeholder="Port"
                            value={p}
                            onChange={(_: any, { value }: any) => setP(value)}
                            onBlur={() => dispatcher.slippi.setPort(p)}
                        />
                        <div style={{ padding: "10px 0" }}>
                            <Button primary onClick={() => props.onClick(p)}>Connect</Button>
                        </div>
                    </Grid.Column>
                    <Grid.Column>
                        <VerticalHeader icon>
                            <CustomIcon image={dolphinLogoSVG} size={54} color="#353636" />
                            Monitor for SLP file changes
                        </VerticalHeader>
                        <Input
                            style={{ maxWidth: "initial" }}
                            action={<Button onClick={selectPath}>Choose</Button>}
                            placeholder="Choose a folder..."
                            value={liveSlpFilesPath}
                        />
                        <div style={{ padding: "10px 0" }}>
                            <Button
                                primary={true}
                                disabled={!liveSlpFilesPath}
                                onClick={() => streamManager.monitorSlpFolder(liveSlpFilesPath)}
                            >
                                Start monitoring
                            </Button>
                        </div>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </Segment>
    );
};

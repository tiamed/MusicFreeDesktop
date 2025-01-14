import SvgAsset from "@/renderer/components/SvgAsset";
import Evt from "@/renderer/core/events";
import "./index.scss";
import SwitchCase from "@/renderer/components/SwitchCase";
import trackPlayer from "@/renderer/core/track-player";
import { RepeatMode } from "@/renderer/core/track-player/enum";
import { useEffect, useRef, useState } from "react";
import Condition from "@/renderer/components/Condition";
import Slider from "rc-slider";
import { showContextMenu } from "@/renderer/components/ContextMenu";
import { toast } from "react-toastify";
import { showModal } from "@/renderer/components/Modal";
import rendererAppConfig from "@/common/app-config/renderer";
import { ipcRendererInvoke, ipcRendererSend } from "@/common/ipc-util/renderer";
import {
  sendMessageToLyricWindow,
  setMainWindowMessagePort,
} from "@/renderer/utils/lrc-window-message-channel";
import classNames from "@/renderer/utils/classnames";
import { useLyric } from "@/renderer/core/track-player/player";

export default function Extra() {
  const repeatMode = trackPlayer.useRepeatMode();

  return (
    <div className="music-extra">
      <QualityBtn></QualityBtn>
      <SpeedBtn></SpeedBtn>
      <VolumeBtn></VolumeBtn>
      <LyricBtn></LyricBtn>
      <div
        className="extra-btn"
        onClick={() => {
          trackPlayer.toggleRepeatMode();
        }}
        title={
          repeatMode === RepeatMode.Loop
            ? "单曲循环"
            : repeatMode === RepeatMode.Queue
            ? "列表循环"
            : "随机播放"
        }
      >
        <SwitchCase.Switch switch={repeatMode}>
          <SwitchCase.Case case={RepeatMode.Loop}>
            <SvgAsset iconName="repeat-song"></SvgAsset>
          </SwitchCase.Case>
          <SwitchCase.Case case={RepeatMode.Queue}>
            <SvgAsset iconName="repeat-song-1"></SvgAsset>
          </SwitchCase.Case>
          <SwitchCase.Case case={RepeatMode.Shuffle}>
            <SvgAsset iconName="shuffle"></SvgAsset>
          </SwitchCase.Case>
        </SwitchCase.Switch>
      </div>
      <div
        className="extra-btn"
        title="播放列表"
        role="button"
        onClick={() => {
          Evt.emit("SWITCH_PLAY_LIST");
        }}
      >
        <SvgAsset iconName="playlist"></SvgAsset>
      </div>
    </div>
  );
}

function VolumeBtn() {
  const volume = trackPlayer.useVolume();
  const tmpVolumeRef = useRef<number | null>(null);
  const [showVolumeBubble, setShowVolumeBubble] = useState(false);

  return (
    <div
      className="extra-btn"
      role="button"
      onMouseOver={() => {
        setShowVolumeBubble(true);
      }}
      onMouseOut={() => {
        setShowVolumeBubble(false);
      }}
      onClick={() => {
        if (tmpVolumeRef === null) {
          tmpVolumeRef.current = 0;
        }
        tmpVolumeRef.current =
          tmpVolumeRef.current === volume
            ? volume === 0
              ? 1
              : 0
            : tmpVolumeRef.current;
        trackPlayer.setVolume(tmpVolumeRef.current);
        tmpVolumeRef.current = volume;
      }}
    >
      <Condition condition={showVolumeBubble}>
        <div
          className="volume-bubble-container shadow backdrop-color"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="volume-slider-container">
            <Slider
              vertical
              min={0}
              max={1}
              step={0.01}
              onChange={(val) => {
                trackPlayer.setVolume(val as number);
              }}
              value={volume}
              trackStyle={{
                background: "var(--primaryColor)",
              }}
              handleStyle={{
                height: 12,
                width: 12,
                marginLeft: -4,
                borderColor: "var(--primaryColor)",
              }}
              railStyle={{
                background: "#d8d8d8",
              }}
            ></Slider>
          </div>
          <div className="volume-slider-tag">{(volume * 100).toFixed(0)}%</div>
        </div>
      </Condition>
      <SvgAsset
        title={volume === 0 ? "恢复音量" : "静音"}
        iconName={volume === 0 ? "speaker-x-mark" : "speaker-wave"}
      ></SvgAsset>
    </div>
  );
}

function SpeedBtn() {
  const speed = trackPlayer.useSpeed();
  const [showSpeedBubble, setShowSpeedBubble] = useState(false);
  const tmpSpeedRef = useRef<number | null>(null);

  return (
    <div
      className="extra-btn"
      role="button"
      onMouseOver={() => {
        setShowSpeedBubble(true);
      }}
      onMouseOut={() => {
        setShowSpeedBubble(false);
      }}
      onClick={() => {
        if (tmpSpeedRef.current === null || tmpSpeedRef.current === speed) {
          tmpSpeedRef.current = 1;
        }

        trackPlayer.setSpeed(tmpSpeedRef.current);
        tmpSpeedRef.current = speed;
      }}
    >
      <Condition condition={showSpeedBubble}>
        <div
          className="volume-bubble-container shadow backdrop-color"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="volume-slider-container">
            <Slider
              vertical
              min={0.25}
              max={2}
              step={0.05}
              onChange={(val) => {
                trackPlayer.setSpeed(val as number);
              }}
              value={speed}
              trackStyle={{
                background: "var(--primaryColor)",
              }}
              handleStyle={{
                height: 12,
                width: 12,
                marginLeft: -4,
                borderColor: "var(--primaryColor)",
              }}
              railStyle={{
                background: "#d8d8d8",
              }}
            ></Slider>
          </div>
          <div className="volume-slider-tag">{speed.toFixed(2)}x</div>
        </div>
      </Condition>
      <SvgAsset title={"倍速播放"} iconName={"dashboard-speed"}></SvgAsset>
    </div>
  );
}

function QualityBtn() {
  const quality = trackPlayer.useQuality();

  return (
    <div
      className="extra-btn"
      role="button"
      onClick={(e) => {
        showModal("SelectOne", {
          title: "切换音质",
          defaultValue: quality,
          defaultExtra: true,
          extra: "仅设置当前歌曲",
          choices: [
            {
              value: "low",
              label: "低音质",
            },
            {
              value: "standard",
              label: "标准音质",
            },
            {
              value: "high",
              label: "高音质",
            },
            {
              value: "super",
              label: "超高音质",
            },
          ],
          onOk(value, extra) {
            trackPlayer.setQuality(value as IMusic.IQualityKey);
            if (!extra) {
              rendererAppConfig.setAppConfigPath(
                "playMusic.defaultQuality",
                value
              );
            }
          },
        });
      }}
    >
      <SwitchCase.Switch switch={quality}>
        <SwitchCase.Case case={"low"}>
          <SvgAsset title={"低音质"} iconName={"lq"}></SvgAsset>
        </SwitchCase.Case>
        <SwitchCase.Case case={"standard"}>
          <SvgAsset title={"标准音质"} iconName={"sd"}></SvgAsset>
        </SwitchCase.Case>
        <SwitchCase.Case case={"high"}>
          <SvgAsset title={"高音质"} iconName={"hq"}></SvgAsset>
        </SwitchCase.Case>
        <SwitchCase.Case case={"super"}>
          <SvgAsset title={"超高音质"} iconName={"sq"}></SvgAsset>
        </SwitchCase.Case>
      </SwitchCase.Switch>
    </div>
  );
}

function LyricBtn() {
  const rendererConfig = rendererAppConfig.useAppConfig();
  const enableDesktopLyric = rendererConfig?.lyric?.enableDesktopLyric ?? false;
  const lyric = useLyric();

  useEffect(() => {
    // 同步歌词 这样写貌似不好 应该用回调
    if (enableDesktopLyric) {
      // 同步歌词
      if (lyric?.currentLrc) {
        const currentLrc = lyric?.currentLrc;
        // 同步两句歌词
        ipcRendererSend("send-to-lyric-window", {
          timeStamp: Date.now(),
          lrc: currentLrc
            ? [currentLrc.lrc, lyric.parser.getLyric()[currentLrc.index + 1]]
            : [],
        });
      } else {
        ipcRendererSend("send-to-lyric-window", {
          timeStamp: Date.now(),
          lrc: [],
        });
      }
    }
  }, [lyric, enableDesktopLyric]);

  return (
    <div
      className={classNames({
        "extra-btn": true,
        highlight: enableDesktopLyric,
      })}
      role="button"
      onClick={async () => {
        ipcRendererInvoke("set-lyric-window", !enableDesktopLyric);
      }}
    >
      <SvgAsset iconName="lyric"></SvgAsset>
    </div>
  );
}

import React, { useEffect, useImperativeHandle, useMemo, useRef, forwardRef } from 'react';
import { Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

export interface LWCandle {
  time: number; // seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ChartMarker {
  time: number; // Unix timestamp in seconds
  position: 'belowBar' | 'aboveBar';
  color: string;
  shape: 'circle';
  text: string;
  size?: number;
  textColor?: string;
}

export interface ChartPriceLine {
  price: number;
  color: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed';
  title: string;
}

export interface BridgeTheme {
  bg: string;
  fg: string;
}

export interface LightweightChartBridgeProps {
  candles: LWCandle[];
  smaPeriod?: number;
  theme?: BridgeTheme;
  height?: number;
}

export interface LightweightChartBridgeRef {
  setData: (candles: LWCandle[]) => void;
  updateBar: (bar: LWCandle) => void;
  setSMA: (period: number, candles?: LWCandle[]) => void;
  setMarkers: (markers: ChartMarker[]) => void;
  setPriceLines: (lines: ChartPriceLine[]) => void;
}

const html = require('../../../assets/chart/index.html');

const LightweightChartBridge = forwardRef<LightweightChartBridgeRef, LightweightChartBridgeProps>(
  ({ candles, smaPeriod = 20, theme = { bg: '#0b0f13', fg: '#c5ced9' }, height = 400 }, ref) => {
    const webRef = useRef<WebView>(null);
    const size = useMemo(() => ({ width: Dimensions.get('window').width, height }), [height]);

    function post(type: string, payload?: any) {
      const msg = JSON.stringify({ type, payload });
      webRef.current?.postMessage(msg);
    }

    useImperativeHandle(ref, () => ({
      setData: (c) => post('setData', { candles: c }),
      updateBar: (b) => post('updateBar', { bar: b }),
      setSMA: (p, c) => post('setSMA', { period: p, candles: c }),
      setMarkers: (m) => post('setMarkers', { markers: m }),
      setPriceLines: (l) => post('setPriceLines', { lines: l }),
    }));

    useEffect(() => {
      // initialize and load initial data
      const initTimeout = setTimeout(() => {
        post('init', { theme, width: size.width, height: size.height });
        post('setData', { candles });
        if (smaPeriod) post('setSMA', { period: smaPeriod, candles });
      }, 50);
      return () => clearTimeout(initTimeout);
    }, [size.width, size.height]);

    useEffect(() => {
      post('setData', { candles });
      if (smaPeriod) post('setSMA', { period: smaPeriod, candles });
    }, [JSON.stringify(candles), smaPeriod]);

    return (
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={html}
        onMessage={() => {}}
        javaScriptEnabled
        scalesPageToFit
        automaticallyAdjustContentInsets={false}
        style={{ height: size.height, width: size.width, backgroundColor: 'transparent' }}
      />
    );
  }
);

export default LightweightChartBridge;



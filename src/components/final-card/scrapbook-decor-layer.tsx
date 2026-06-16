"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import styles from "./final-card.module.css";
import { scrapbookDecorAssets, type ScrapbookDecorAsset } from "./scrapbook-decor-config";

type Props = {
  debugEnabled: boolean;
};

type AssetField =
  | "top"
  | "left"
  | "right"
  | "bottom"
  | "width"
  | "rotate"
  | "opacity"
  | "zIndex"
  | "visible"
  | "hideOnMobile";

type MobileField = "top" | "left" | "right" | "bottom" | "width" | "rotate" | "opacity" | "zIndex" | "visible";

const toCssValue = (value?: string) => value ?? "auto";

const toAssetStyle = (asset: ScrapbookDecorAsset) =>
  ({
    "--asset-top": toCssValue(asset.top),
    "--asset-left": toCssValue(asset.left),
    "--asset-right": toCssValue(asset.right),
    "--asset-bottom": toCssValue(asset.bottom),
    "--asset-width": asset.width,
    "--asset-rotate": `${asset.rotate}deg`,
    "--asset-opacity": String(asset.opacity),
    "--asset-z-index": String(asset.zIndex),
    "--asset-mobile-top": toCssValue(asset.mobile?.top ?? asset.top),
    "--asset-mobile-left": toCssValue(asset.mobile?.left ?? asset.left),
    "--asset-mobile-right": toCssValue(asset.mobile?.right ?? asset.right),
    "--asset-mobile-bottom": toCssValue(asset.mobile?.bottom ?? asset.bottom),
    "--asset-mobile-width": asset.mobile?.width ?? asset.width,
    "--asset-mobile-rotate": `${asset.mobile?.rotate ?? asset.rotate}deg`,
    "--asset-mobile-opacity": String(asset.mobile?.opacity ?? asset.opacity),
    "--asset-mobile-z-index": String(asset.mobile?.zIndex ?? asset.zIndex)
  }) as CSSProperties;

const normalizeString = (value: string) => (value.trim() === "" ? undefined : value);

const numberField = (value: number) => String(value);

export const ScrapbookDecorLayer = ({ debugEnabled }: Props) => {
  const [assets, setAssets] = useState<ScrapbookDecorAsset[]>(scrapbookDecorAssets);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(scrapbookDecorAssets[0]?.id ?? "");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? assets[0],
    [assets, selectedAssetId]
  );

  const updateAsset = (assetId: string, updater: (asset: ScrapbookDecorAsset) => ScrapbookDecorAsset) => {
    setAssets((current) => current.map((asset) => (asset.id === assetId ? updater(asset) : asset)));
  };

  const updateField = (field: AssetField, value: string | boolean) => {
    if (!selectedAsset) {
      return;
    }

    updateAsset(selectedAsset.id, (asset) => {
      if (field === "visible" || field === "hideOnMobile") {
        return {
          ...asset,
          [field]: Boolean(value)
        };
      }

      if (field === "rotate" || field === "opacity" || field === "zIndex") {
        return {
          ...asset,
          [field]: value === "" ? 0 : Number(value)
        };
      }

      return {
        ...asset,
        [field]: normalizeString(String(value))
      };
    });
  };

  const updateMobileField = (field: MobileField, value: string | boolean) => {
    if (!selectedAsset) {
      return;
    }

    updateAsset(selectedAsset.id, (asset) => {
      const currentMobile = asset.mobile ?? {};

      if (field === "visible") {
        return {
          ...asset,
          mobile: {
            ...currentMobile,
            visible: Boolean(value)
          }
        };
      }

      if (field === "rotate" || field === "opacity" || field === "zIndex") {
        return {
          ...asset,
          mobile: {
            ...currentMobile,
            [field]: value === "" ? undefined : Number(value)
          }
        };
      }

      return {
        ...asset,
        mobile: {
          ...currentMobile,
          [field]: normalizeString(String(value))
        }
      };
    });
  };

  const copyConfig = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(assets, null, 2));
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 1800);
    }
  };

  return (
    <>
      <div className={styles.paperDecorLayer} aria-hidden="true">
        {assets
          .filter((asset) => asset.visible)
          .map((asset) => {
            const className =
              asset.kind === "note"
                ? `${styles.paperDecorAsset} ${styles.paperDecorNote}`
                : styles.paperDecorAsset;

            return (
              <div
                key={asset.id}
                className={className}
                style={toAssetStyle(asset)}
                data-hide-on-mobile={asset.hideOnMobile}
                data-mobile-visible={asset.mobile?.visible ?? true}
              >
                {asset.kind === "note" ? (
                  <div
                    className={styles.paperDecorNoteInner}
                    style={{ backgroundImage: `url(${asset.src})` }}
                  >
                    {asset.content}
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.src} alt="" className={styles.paperDecorImage} />
                )}
              </div>
            );
          })}
      </div>

      {debugEnabled && selectedAsset ? (
        <aside className={styles.assetDebugPanel}>
          <div className={styles.assetDebugHeader}>
            <strong>Asset Debug</strong>
            <button type="button" className={styles.assetDebugCopyButton} onClick={copyConfig}>
              Copy config
            </button>
          </div>

          <label className={styles.assetDebugField}>
            <span>Asset</span>
            <select value={selectedAsset.id} onChange={(event) => setSelectedAssetId(event.target.value)}>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.label}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.assetDebugGrid}>
            <label className={styles.assetDebugField}>
              <span>top</span>
              <input value={selectedAsset.top ?? ""} onChange={(event) => updateField("top", event.target.value)} />
            </label>
            <label className={styles.assetDebugField}>
              <span>left</span>
              <input value={selectedAsset.left ?? ""} onChange={(event) => updateField("left", event.target.value)} />
            </label>
            <label className={styles.assetDebugField}>
              <span>right</span>
              <input value={selectedAsset.right ?? ""} onChange={(event) => updateField("right", event.target.value)} />
            </label>
            <label className={styles.assetDebugField}>
              <span>bottom</span>
              <input
                value={selectedAsset.bottom ?? ""}
                onChange={(event) => updateField("bottom", event.target.value)}
              />
            </label>
            <label className={styles.assetDebugField}>
              <span>width</span>
              <input value={selectedAsset.width} onChange={(event) => updateField("width", event.target.value)} />
            </label>
            <label className={styles.assetDebugField}>
              <span>rotate</span>
              <input
                type="number"
                value={numberField(selectedAsset.rotate)}
                onChange={(event) => updateField("rotate", event.target.value)}
              />
            </label>
            <label className={styles.assetDebugField}>
              <span>opacity</span>
              <input
                type="number"
                step="0.05"
                value={numberField(selectedAsset.opacity)}
                onChange={(event) => updateField("opacity", event.target.value)}
              />
            </label>
            <label className={styles.assetDebugField}>
              <span>zIndex</span>
              <input
                type="number"
                value={numberField(selectedAsset.zIndex)}
                onChange={(event) => updateField("zIndex", event.target.value)}
              />
            </label>
          </div>

          <div className={styles.assetDebugToggles}>
            <label>
              <input
                type="checkbox"
                checked={selectedAsset.visible}
                onChange={(event) => updateField("visible", event.target.checked)}
              />
              <span>visible</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={selectedAsset.hideOnMobile}
                onChange={(event) => updateField("hideOnMobile", event.target.checked)}
              />
              <span>hideOnMobile</span>
            </label>
          </div>

          <div className={styles.assetDebugMobileSection}>
            <strong>Mobile overrides</strong>
            <div className={styles.assetDebugGrid}>
              <label className={styles.assetDebugField}>
                <span>mobileTop</span>
                <input
                  value={selectedAsset.mobile?.top ?? ""}
                  onChange={(event) => updateMobileField("top", event.target.value)}
                />
              </label>
              <label className={styles.assetDebugField}>
                <span>mobileLeft</span>
                <input
                  value={selectedAsset.mobile?.left ?? ""}
                  onChange={(event) => updateMobileField("left", event.target.value)}
                />
              </label>
              <label className={styles.assetDebugField}>
                <span>mobileRight</span>
                <input
                  value={selectedAsset.mobile?.right ?? ""}
                  onChange={(event) => updateMobileField("right", event.target.value)}
                />
              </label>
              <label className={styles.assetDebugField}>
                <span>mobileBottom</span>
                <input
                  value={selectedAsset.mobile?.bottom ?? ""}
                  onChange={(event) => updateMobileField("bottom", event.target.value)}
                />
              </label>
              <label className={styles.assetDebugField}>
                <span>mobileWidth</span>
                <input
                  value={selectedAsset.mobile?.width ?? ""}
                  onChange={(event) => updateMobileField("width", event.target.value)}
                />
              </label>
              <label className={styles.assetDebugField}>
                <span>mobileRotate</span>
                <input
                  type="number"
                  value={selectedAsset.mobile?.rotate ?? ""}
                  onChange={(event) => updateMobileField("rotate", event.target.value)}
                />
              </label>
              <label className={styles.assetDebugField}>
                <span>mobileOpacity</span>
                <input
                  type="number"
                  step="0.05"
                  value={selectedAsset.mobile?.opacity ?? ""}
                  onChange={(event) => updateMobileField("opacity", event.target.value)}
                />
              </label>
              <label className={styles.assetDebugField}>
                <span>mobileZIndex</span>
                <input
                  type="number"
                  value={selectedAsset.mobile?.zIndex ?? ""}
                  onChange={(event) => updateMobileField("zIndex", event.target.value)}
                />
              </label>
            </div>
            <label className={styles.assetDebugToggleSingle}>
              <input
                type="checkbox"
                checked={selectedAsset.mobile?.visible ?? true}
                onChange={(event) => updateMobileField("visible", event.target.checked)}
              />
              <span>mobileVisible</span>
            </label>
          </div>

          <div className={styles.assetDebugStatus}>
            {copyState === "copied" ? "Config copied" : copyState === "failed" ? "Copy failed" : "Live preview enabled"}
          </div>
        </aside>
      ) : null}
    </>
  );
};

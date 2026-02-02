"use client";

import { ContentBlock, GlobalSettings, PageContent, MediaAsset } from "@/lib/content/types";

const textInput =
  "w-full bg-transparent text-inherit outline-none placeholder:text-stone-400 focus:border-b focus:border-amber-300";

const labelClass = "text-xs uppercase tracking-[0.3em] text-stone-500";

const rangeClass =
  "h-2 w-full appearance-none rounded-full bg-stone-200 accent-amber-500";

type Props = {
  content: PageContent;
  globals: GlobalSettings;
  onChangeContent: (content: PageContent) => void;
  onChangeGlobals: (globals: GlobalSettings) => void;
};

const updateBlock = (blocks: ContentBlock[], index: number, block: ContentBlock) =>
  blocks.map((item, i) => (i === index ? block : item));

const MediaControls = ({
  label,
  media,
  onChange,
}: {
  label: string;
  media: MediaAsset;
  onChange: (media: MediaAsset) => void;
}) => (
  <div className="rounded-2xl border border-stone-200 bg-white/80 p-4">
    <p className={labelClass}>{label}</p>
    <input
      className={`${textInput} mt-3 text-sm text-stone-700`}
      value={media.url}
      onChange={(event) => onChange({ ...media, url: event.target.value })}
      placeholder="Media URL"
    />
    <input
      className={`${textInput} mt-3 text-sm text-stone-500`}
      value={media.alt}
      onChange={(event) => onChange({ ...media, alt: event.target.value })}
      placeholder="Alt text"
    />
    <div className="mt-4 grid gap-3">
      <label className="text-xs text-stone-500">
        X position ({media.x}%)
        <input
          className={rangeClass}
          type="range"
          min={0}
          max={100}
          value={media.x}
          onChange={(event) =>
            onChange({ ...media, x: Number(event.target.value) })
          }
        />
      </label>
      <label className="text-xs text-stone-500">
        Y position ({media.y}%)
        <input
          className={rangeClass}
          type="range"
          min={0}
          max={100}
          value={media.y}
          onChange={(event) =>
            onChange({ ...media, y: Number(event.target.value) })
          }
        />
      </label>
      <label className="text-xs text-stone-500">
        Scale ({media.scale.toFixed(2)})
        <input
          className={rangeClass}
          type="range"
          min={0.6}
          max={1.6}
          step={0.02}
          value={media.scale}
          onChange={(event) =>
            onChange({ ...media, scale: Number(event.target.value) })
          }
        />
      </label>
    </div>
  </div>
);

export default function InlineEditor({
  content,
  globals,
  onChangeContent,
  onChangeGlobals,
}: Props) {
  return (
    <div className="space-y-24">
      <section className="grid gap-10 rounded-3xl border border-stone-200 bg-white/80 p-6 shadow-lg shadow-amber-900/10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <p className={labelClass}>Global identity</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Logo mark
              <input
                className={`${textInput} mt-2 text-lg font-semibold text-stone-900`}
                value={globals.logoMark}
                onChange={(event) =>
                  onChangeGlobals({ ...globals, logoMark: event.target.value })
                }
              />
            </label>
            <label className={labelClass}>
              Logo text
              <input
                className={`${textInput} mt-2 text-lg font-semibold text-stone-900`}
                value={globals.logoText}
                onChange={(event) =>
                  onChangeGlobals({ ...globals, logoText: event.target.value })
                }
              />
            </label>
          </div>
          <label className={labelClass}>
            Motto
            <input
              className={`${textInput} mt-2 text-xl font-semibold text-stone-900`}
              value={globals.motto}
              onChange={(event) =>
                onChangeGlobals({ ...globals, motto: event.target.value })
              }
            />
          </label>
        </div>
        <div className="rounded-2xl bg-stone-900 p-6 text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">
            {globals.logoText}
          </p>
          <p className="mt-4 text-2xl font-semibold">{globals.motto}</p>
          <p className="mt-4 text-sm text-amber-100/70">
            Inline edits update the draft preview. Save to keep changes.
          </p>
        </div>
      </section>

      {content.blocks.map((block, index) => {
        if (block.type === "hero") {
          return (
            <section key={block.id} className="space-y-6">
              <p className={labelClass}>Hero</p>
              <div className="rounded-[36px] border border-stone-200 bg-stone-900 p-6 text-white">
                <label className="text-xs uppercase tracking-[0.3em] text-amber-200/70">
                  Tagline
                  <input
                    className={`${textInput} mt-3 text-2xl font-semibold text-white`}
                    value={block.data.tagline ?? ""}
                    onChange={(event) =>
                      onChangeContent({
                        ...content,
                        blocks: updateBlock(content.blocks, index, {
                          ...block,
                          data: { ...block.data, tagline: event.target.value },
                        }),
                      })
                    }
                  />
                </label>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/80 p-4">
                <p className={labelClass}>Hero video</p>
                <input
                  className={`${textInput} mt-3 text-sm text-stone-700`}
                  value={block.data.videoUrl}
                  onChange={(event) =>
                    onChangeContent({
                      ...content,
                      blocks: updateBlock(content.blocks, index, {
                        ...block,
                        data: { ...block.data, videoUrl: event.target.value },
                      }),
                    })
                  }
                  placeholder="Video URL"
                />
                <div className="mt-4 grid gap-3">
                  {(() => {
                    const videoX = block.data.videoX ?? 50;
                    const videoY = block.data.videoY ?? 50;
                    const videoScale = block.data.videoScale ?? 1;
                    return (
                      <>
                  <label className="text-xs text-stone-500">
                    X position ({videoX}%)
                    <input
                      className={rangeClass}
                      type="range"
                      min={0}
                      max={100}
                      value={videoX}
                      onChange={(event) =>
                        onChangeContent({
                          ...content,
                          blocks: updateBlock(content.blocks, index, {
                            ...block,
                            data: {
                              ...block.data,
                              videoX: Number(event.target.value),
                            },
                          }),
                        })
                      }
                    />
                  </label>
                  <label className="text-xs text-stone-500">
                    Y position ({videoY}%)
                    <input
                      className={rangeClass}
                      type="range"
                      min={0}
                      max={100}
                      value={videoY}
                      onChange={(event) =>
                        onChangeContent({
                          ...content,
                          blocks: updateBlock(content.blocks, index, {
                            ...block,
                            data: {
                              ...block.data,
                              videoY: Number(event.target.value),
                            },
                          }),
                        })
                      }
                    />
                  </label>
                  <label className="text-xs text-stone-500">
                    Scale ({videoScale.toFixed(2)})
                    <input
                      className={rangeClass}
                      type="range"
                      min={0.6}
                      max={1.6}
                      step={0.02}
                      value={videoScale}
                      onChange={(event) =>
                        onChangeContent({
                          ...content,
                          blocks: updateBlock(content.blocks, index, {
                            ...block,
                            data: {
                              ...block.data,
                              videoScale: Number(event.target.value),
                            },
                          }),
                        })
                      }
                    />
                  </label>
                      </>
                    );
                  })()}
                </div>
              </div>
              <label className={labelClass}>
                Overlay opacity ({block.data.overlayOpacity})
                <input
                  className={rangeClass}
                  type="range"
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  value={block.data.overlayOpacity}
                  onChange={(event) =>
                    onChangeContent({
                      ...content,
                      blocks: updateBlock(content.blocks, index, {
                        ...block,
                        data: {
                          ...block.data,
                          overlayOpacity: Number(event.target.value),
                        },
                      }),
                    })
                  }
                />
              </label>
              <label className={labelClass}>
                Desaturate ({(block.data.videoDesaturate ?? 0.6).toFixed(2)})
                <input
                  className={rangeClass}
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={block.data.videoDesaturate ?? 0.6}
                  onChange={(event) =>
                    onChangeContent({
                      ...content,
                      blocks: updateBlock(content.blocks, index, {
                        ...block,
                        data: {
                          ...block.data,
                          videoDesaturate: Number(event.target.value),
                        },
                      }),
                    })
                  }
                />
              </label>
            </section>
          );
        }

        if (block.type === "brand-message") {
          return (
            <section key={block.id} className="space-y-4">
              <p className={labelClass}>Brand message</p>
              <input
                className={`${textInput} text-sm font-semibold text-stone-500`}
                value={block.data.heading}
                onChange={(event) =>
                  onChangeContent({
                    ...content,
                    blocks: updateBlock(content.blocks, index, {
                      ...block,
                      data: { ...block.data, heading: event.target.value },
                    }),
                  })
                }
              />
              <textarea
                className={`${textInput} min-h-[90px] text-2xl font-semibold text-stone-900`}
                value={block.data.message}
                onChange={(event) =>
                  onChangeContent({
                    ...content,
                    blocks: updateBlock(content.blocks, index, {
                      ...block,
                      data: { ...block.data, message: event.target.value },
                    }),
                  })
                }
              />
            </section>
          );
        }

        if (block.type === "triple-media") {
          return (
            <section key={block.id} className="space-y-6">
              <p className={labelClass}>Triple media</p>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-stone-200 bg-white p-5">
                  <input
                    className={`${textInput} text-xl font-semibold text-stone-900`}
                    value={block.data.leftTitle}
                    onChange={(event) =>
                      onChangeContent({
                        ...content,
                        blocks: updateBlock(content.blocks, index, {
                          ...block,
                          data: { ...block.data, leftTitle: event.target.value },
                        }),
                      })
                    }
                  />
                  <textarea
                    className={`${textInput} mt-3 min-h-[80px] text-sm text-stone-600`}
                    value={block.data.leftBody}
                    onChange={(event) =>
                      onChangeContent({
                        ...content,
                        blocks: updateBlock(content.blocks, index, {
                          ...block,
                          data: { ...block.data, leftBody: event.target.value },
                        }),
                      })
                    }
                  />
                  <label className="mt-4 block text-xs text-stone-500">
                    Accent color
                    <input
                      className="mt-2 h-10 w-full rounded-xl border border-stone-200 px-3"
                      value={block.data.leftAccent}
                      onChange={(event) =>
                        onChangeContent({
                          ...content,
                          blocks: updateBlock(content.blocks, index, {
                            ...block,
                            data: { ...block.data, leftAccent: event.target.value },
                          }),
                        })
                      }
                    />
                  </label>
                </div>
                <MediaControls
                  label="Middle image"
                  media={block.data.middleMedia}
                  onChange={(media) =>
                    onChangeContent({
                      ...content,
                      blocks: updateBlock(content.blocks, index, {
                        ...block,
                        data: { ...block.data, middleMedia: media },
                      }),
                    })
                  }
                />
                <MediaControls
                  label="Right video"
                  media={block.data.rightMedia}
                  onChange={(media) =>
                    onChangeContent({
                      ...content,
                      blocks: updateBlock(content.blocks, index, {
                        ...block,
                        data: { ...block.data, rightMedia: media },
                      }),
                    })
                  }
                />
              </div>
            </section>
          );
        }

        if (block.type === "landscape") {
          return (
            <section key={block.id} className="space-y-6">
              <p className={labelClass}>Landscape</p>
              <MediaControls
                label="Landscape image"
                media={block.data.media}
                onChange={(media) =>
                  onChangeContent({
                    ...content,
                    blocks: updateBlock(content.blocks, index, {
                      ...block,
                      data: { ...block.data, media },
                    }),
                  })
                }
              />
              <input
                className={`${textInput} text-lg font-semibold text-stone-900`}
                value={block.data.caption}
                onChange={(event) =>
                  onChangeContent({
                    ...content,
                    blocks: updateBlock(content.blocks, index, {
                      ...block,
                      data: { ...block.data, caption: event.target.value },
                    }),
                  })
                }
              />
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}

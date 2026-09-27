
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ChevronDown, Paperclip } from "lucide-react";
import ComposerAttachments from "./ComposerAttachments";
import { RemoteAiBusyBanner } from "./RemoteAiBusyBanner";
import { MentionDropdown } from "./MentionDropdown";
import { ComposerMobileModeBar } from "./ComposerMobileModeBar";
import { ComposerAnimatedInput } from "./ComposerAnimatedInput";
import { prewarmSendPath } from "../lib/prewarmSendPath";
import ComposerServicePanel from "./ComposerServicePanel";
import StarterCards, { StarterChips } from "./StarterCards";

import { ComposerComputerProvider } from "@/components/chat/ComposerComputerContext";
import ComputerRunViewport from "@/components/chat/ComputerRunViewport";
import { useComputerLiveView } from "@/lib/computer/liveView";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/BrandLogo";
import ComposerModelMenu from "../ComposerModelMenu";

import type { AttachedFile } from "../hooks/useAttachments";





interface ChatComposerSectionProps {
  sidebarCollapsed: boolean;
  sidebarOffset?: number;
  loadingMessages: boolean;
  messagesLength: number;
  attachedFiles: AttachedFile[];
  removeAttachment: (i: number) => void;
  remoteAiBusy: { name: string } | null;
  plusMenuOpen: boolean;
  renderPlusMenu: () => ReactNode;
  mentionQuery: { q: string } | null;
  members: any[];
  onlineUsers: any;
  colorForUser: (id?: string | null) => any;
  insertMention: (name: string) => void;
  composerMobileModeBarProps: Record<string, any>;
  composerAnimatedInputProps: Record<string, any>;
  navigate: any;
  desktopModeChipsProps: Record<string, any>;
  /** Optional greeting node rendered just above the input on empty desktop state. */
  desktopGreeting?: ReactNode;
  /** Ref forwarded to the composer wrapper so the plus menu can anchor to it. */
  composerRef?: React.Ref<HTMLDivElement>;
  /** Image-mode tools strip (upload / background removal / characters). */
  imageTools?: ReactNode;
}

const EMPTY_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_124724_bc041163-d651-425f-aea3-2acc1efc2c96.mp4";

function DesktopFastshotComposer({ props }: { props: ChatComposerSectionProps }) {
  const c = props.composerAnimatedInputProps as any;
  const d = props.desktopModeChipsProps as any;
  const value = String(c.input ?? "");
  const send = () => { if (value.trim() || props.attachedFiles.length > 0) void c.handleSend(value); };
  return (
    <section className="desktop-fastshot-empty" aria-label="Start a new chat">
      <video className="desktop-fastshot-video" autoPlay muted loop playsInline aria-hidden="true"><source src={EMPTY_VIDEO} type="video/mp4" /></video>
      <div className="desktop-fastshot-shade" aria-hidden="true" />
      <div className="desktop-fastshot-frame">
        <header className="desktop-fastshot-nav">
          <a className="desktop-fastshot-brand" href="/" aria-label="Megsy home"><BrandLogo className="desktop-fastshot-mark" /><span>Megsy</span></a>
          <nav className="desktop-fastshot-links" aria-label="Primary navigation"><a href="/chat">Chat</a><a href="/images">Images</a><a href="/pricing">Pricing</a><a href="/docs">Docs</a></nav>
          <Button className="desktop-fastshot-cta" onClick={() => props.navigate("/pricing")}>Upgrade</Button>
        </header>
        <main className="desktop-fastshot-hero">
          <h1>Describe anything. Megsy will build it.</h1>
          <form className="desktop-fastshot-card" onSubmit={(event) => { event.preventDefault(); send(); }}>
            <textarea value={value} onChange={(event) => c.setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Build a fintech tracking app with bank level privacy and..." aria-label="Message Megsy" rows={1} />
            <div className="desktop-fastshot-tools">
              <div className="desktop-fastshot-chips">
                <Button type="button" variant="ghost" onClick={() => d.handleModeChange?.("images")}><span className="desktop-fastshot-chip-dot" />Images</Button>
                <Button type="button" variant="ghost" onClick={() => d.handleModeChange?.("slides")}><span className="desktop-fastshot-chip-dot" />Slides</Button>
                <Button type="button" variant="ghost" onClick={() => d.handleModeChange?.("deep-research")}><span className="desktop-fastshot-chip-dot" />Research</Button>
              </div>
              <div className="desktop-fastshot-right">
                <div className="desktop-fastshot-model">
                  <ComposerModelMenu mode={c.chatMode} open={c.tierMenuOpen} onOpenChange={c.setTierMenuOpen} side="top" align="end" selectedModel={c.selectedModel} megsyTier={c.megsyTier} userPlan={c.userPlan || "free"} mediaModel={c.mediaModel} onTierSelect={(tier) => { c.setSelectedModel(null); c.setMegsyTier(tier); }} onChatModelSelect={(model) => c.setSelectedModel(model)} onMediaModelSelect={c.setMediaModel} onModeChange={c.handleModeChange} noIcon renderMobileSheet={false} triggerClassName="desktop-fastshot-model-trigger" />
                  <ChevronDown aria-hidden="true" />
                </div>
                <Button type="button" variant="ghost" className="desktop-fastshot-attach" aria-label="Attach files" onClick={() => { c.setPlusView("main"); c.setPlusMenuOpen(!c.plusMenuOpen); }}><Paperclip /></Button>
                <Button type="submit" variant="neutral" className="desktop-fastshot-send" aria-label="Send message" disabled={!value.trim() && props.attachedFiles.length === 0}><ArrowUp /></Button>
              </div>
            </div>
            <div className="desktop-fastshot-menu-anchor">{props.plusMenuOpen ? props.renderPlusMenu() : null}</div>
          </form>
        </main>
      </div>
    </section>
  );
}

/**
 * Floating bottom composer dock. Lifts to vertical-center on empty desktop
 * state, otherwise sticks to the bottom. Hosts attachments preview, busy
 * banner, plus-menu overlay, @mention dropdown, mobile mode bar, animated
 * input, desktop integrations strip, and the desktop mode chips row.
 */
export function ChatComposerSection(props: ChatComposerSectionProps) {
  const computerView = useComputerLiveView();
  const {
    sidebarCollapsed,
    sidebarOffset,
    loadingMessages,
    messagesLength,
    attachedFiles,
    removeAttachment,
    remoteAiBusy,
    plusMenuOpen,
    renderPlusMenu,
    mentionQuery,
    members,
    onlineUsers,
    colorForUser,
    insertMention,
    composerMobileModeBarProps,
    composerAnimatedInputProps,
    navigate,
    desktopModeChipsProps,
    desktopGreeting,
    composerRef,
  } = props;

  const isEmpty = messagesLength === 0 && !loadingMessages;
  const isDesktopLanding = messagesLength === 0 && !loadingMessages;
  const isMobileViewport = Boolean((composerAnimatedInputProps as any).isMobileViewport);
  // Chips/modes bar visibility: always shown by default; user can toggle via the
  // modes button. Do NOT auto-hide based on active service — chatMode is
  // persisted in localStorage, so auto-hiding causes chips to disappear every
  // time the user returns to the chat page.
  const [modesShown, setModesShown] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const d = desktopModeChipsProps as any;
  // Modes that already render their own labelled header panel. Showing the
  // ActiveServicePill for these too is what produced two chips at once.
  // Every service now renders through the single ComposerServicePanel chip,
  // so there is exactly one indicator on screen for every mode.
  const isDocsAgent = d.selectedAgent?.id === "docs";
  const isDevAgent = d.selectedAgent?.id === "dev";
  const hasActiveService = isDocsAgent || isDevAgent || (d.chatMode && d.chatMode !== "normal");
  const hasHeaderService = hasActiveService;

  // Hide chips whenever a service is active; also hide on mobile once the
  // conversation has started or the user is typing (input focused). They
  // auto-return when the service pill is cleared or the user opens a fresh
  // conversation on desktop.
  const effectiveModesShown = modesShown && !hasActiveService;

  // When the active service clears itself (e.g. automatically after the message
  // it was picked for was sent), bring the modes bar back.
  useEffect(() => {
    if (!hasActiveService) setModesShown(true);
  }, [hasActiveService]);


  // Starter chips: only on the empty landing state, and they disappear the
  // moment the user clicks into the input, types anything, or activates a
  // service. They come back when the service X button clears the mode.
  const composerInputText = String((composerAnimatedInputProps as any)?.input ?? "");
  const starterChipsVisible =
    isEmpty && !hasActiveService && composerInputText.trim().length === 0;



  return (
    <ComposerComputerProvider>
    {isDesktopLanding && !isMobileViewport ? <DesktopFastshotComposer props={props} /> : null}
    <div
      style={{
        ["--sb-left" as any]: (sidebarOffset ?? (sidebarCollapsed ? 56 : 260)) + "px",
        transitionTimingFunction: "cubic-bezier(0.34, 1.35, 0.64, 1)",
      }}
      className={`chat-composer-dock fixed end-0 bottom-[var(--kb-offset,0px)] z-30 px-2 md:px-6 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3 md:pt-6 pointer-events-none transition-[inset-inline-start,top,bottom,transform] duration-[520ms] bg-transparent will-change-transform ${
        isDesktopLanding
          ? "md:hidden"
          : "md:bg-transparent md:backdrop-blur-0 md:border-0"
      }`}
    >
      <div className={`${isDesktopLanding ? "md:max-w-4xl" : "max-w-3xl"} max-w-3xl mx-auto space-y-2 pointer-events-none w-full`}>
        <div className="pointer-events-auto">
          <RemoteAiBusyBanner remoteAiBusy={remoteAiBusy} />
        </div>

        <div className="relative mx-auto w-full max-w-3xl">

            <div data-tour="composer" className="relative">
            <AnimatePresence initial={false}>
              {computerView?.active ? (
                <motion.div
                  key={computerView.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="pointer-events-auto mb-2 overflow-hidden rounded-3xl shadow-lg"
                >
                  <ComputerRunViewport
                    url={computerView.url}
                    poster={computerView.poster}
                    active={computerView.active}
                    status={computerView.status}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
            {mentionQuery && (
              <MentionDropdown
                members={members}
                query={mentionQuery.q}
                onlineUsers={onlineUsers}
                colorForUser={colorForUser}
                insertMention={insertMention}
              />
            )}

            <ComposerMobileModeBar
              {...(composerMobileModeBarProps as any)}
              forceHidden={!effectiveModesShown}
            />

            {isDesktopLanding && desktopGreeting ? (
              <div className="hidden md:flex justify-center mb-8">{desktopGreeting}</div>
            ) : null}

            {/* Mode chips row removed by design: modes live in the + menu. */}

            <AnimatePresence initial={false} mode="popLayout">
              {starterChipsVisible ? (
                <StarterCards
                  key="starter-chips"
                  className="mt-1 mb-1.5"
                  onPick={(_prompt, mode) => {
                    // Cards only turn the service chip on — they never prefill text.
                    if (mode) {
                      d.handleModeChange?.(mode);
                      setModesShown(false);
                    }
                  }}
                />
              ) : null}
            </AnimatePresence>


            <div className="md:contents">
              <div ref={composerRef as any} className="relative z-[8] pointer-events-auto md:p-[1px] md:rounded-[28px]">
                {plusMenuOpen ? renderPlusMenu() : null}
                <div className="md:rounded-[27px] md:overflow-hidden">


                <ComposerAnimatedInput
                {...(composerAnimatedInputProps as any)}
                
                modesToggleVisible
                modesShown={effectiveModesShown}
                onToggleModes={() => setModesShown((v) => !v)}
                chatContext
                onInputFocusChange={(focused) => {
                  setInputFocused(focused);
                  if (focused) prewarmSendPath(true);
                }}
                canSendWithoutText={attachedFiles.length > 0}
                activeServiceHeader={
                  hasHeaderService || attachedFiles.length > 0 ? (
                    <>
                      <ComposerServicePanel
                        chatMode={d.chatMode}
                        isDocsAgent={isDocsAgent}
                        isDevAgent={isDevAgent}
                        mediaModel={d.mediaModel ?? null}
                        setMediaModel={d.setMediaModel}
                        slidesTemplate={d.slidesTemplate}
                        onOpenTemplatePicker={() => d.setSlidesPickerOpen?.(true)}
                        onClear={() => {
                          if (isDocsAgent || isDevAgent) d.setSelectedAgent?.(null);
                          else d.handleModeChange("normal");
                          setModesShown(true);
                        }}
                      />
                      {(d.chatMode === "images" || d.chatMode === "video") && props.imageTools
                        ? props.imageTools
                        : null}
                      {attachedFiles.length > 0 ? (
                        <ComposerAttachments files={attachedFiles} onRemove={removeAttachment} />
                      ) : null}
                    </>
                  ) : null
                }

                />
                </div>
              </div>

              {/* Desktop-only starter chips below the composer (icons, no images). */}
              {starterChipsVisible ? (
                <StarterChips
                  className="mt-3 pointer-events-auto"
                  onPick={(_prompt, mode) => {
                    if (mode) {
                      d.handleModeChange?.(mode);
                      setModesShown(false);
                    }
                  }}
                />
              ) : null}

            </div>

          </div>

          
        </div>
      </div>
    </div>
    </ComposerComputerProvider>
  );

}

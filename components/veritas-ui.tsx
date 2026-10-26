import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/theme";
import type { AuditEvent, EntityNode, SourceStatus } from "@/shared/investigation-data";

export const C = Colors.dark;
export const ACCENT = "#35E0D0";
export const VIOLET = "#A78BFA";
export const AMBER = "#FBBF24";
export const DANGER = "#FB7185";

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; icon: React.ComponentProps<typeof MaterialIcons>["name"]; onPress: () => void };
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable onPress={action.onPress} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]} accessibilityLabel={action.label}>
          <MaterialIcons name={action.icon} size={20} color={ACCENT} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function SectionTitle({ title, meta, onPress, icon }: { title: string; meta?: string; onPress?: () => void; icon?: React.ComponentProps<typeof MaterialIcons>["name"] }) {
  const content = (
    <View style={styles.sectionRow}>
      <View style={styles.sectionTitleWrap}>
        {icon ? <MaterialIcons name={icon} size={17} color={ACCENT} /> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
      {onPress ? <MaterialIcons name="chevron-right" size={18} color={C.muted} /> : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

export function Card({ children, style, tone = "default", onPress }: { children: React.ReactNode; style?: object; tone?: "default" | "accent" | "violet" | "warning" | "danger"; onPress?: () => void }) {
  const toneStyle = tone === "accent" ? styles.cardAccent : tone === "violet" ? styles.cardViolet : tone === "warning" ? styles.cardWarning : tone === "danger" ? styles.cardDanger : null;
  const body = <View style={[styles.card, toneStyle, style]}>{children}</View>;
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>{body}</Pressable> : body;
}

const statusMap: Record<SourceStatus, { label: string; color: string; icon: React.ComponentProps<typeof MaterialIcons>["name"] }> = {
  verified: { label: "VERIFIED", color: ACCENT, icon: "verified-user" },
  uncertain: { label: "REVIEW", color: AMBER, icon: "priority-high" },
  restricted: { label: "RESTRICTED", color: DANGER, icon: "lock" },
};

export function StatusBadge({ status, compact = false }: { status: SourceStatus; compact?: boolean }) {
  const config = statusMap[status];
  return (
    <View style={[styles.statusBadge, { borderColor: `${config.color}55`, backgroundColor: `${config.color}12` }, compact && styles.statusBadgeCompact]}>
      <MaterialIcons name={config.icon} size={compact ? 12 : 14} color={config.color} />
      <Text style={[styles.statusText, { color: config.color }, compact && styles.statusTextCompact]}>{config.label}</Text>
    </View>
  );
}

export function TinyTag({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "cyan" | "violet" | "amber" }) {
  const color = tone === "cyan" ? ACCENT : tone === "violet" ? VIOLET : tone === "amber" ? AMBER : C.muted;
  return <View style={[styles.tinyTag, { borderColor: `${color}44`, backgroundColor: `${color}0D` }]}><Text style={[styles.tinyTagText, { color }]}>{children}</Text></View>;
}

export function StatTile({ label, value, detail, tone = "cyan" }: { label: string; value: string; detail: string; tone?: "cyan" | "violet" | "amber" }) {
  const color = tone === "violet" ? VIOLET : tone === "amber" ? AMBER : ACCENT;
  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statDetail}>{detail}</Text>
    </View>
  );
}

export function ProgressBar({ progress, color = ACCENT }: { progress: number; color?: string }) {
  return <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%`, backgroundColor: color }]} /></View>;
}

export function ConfidenceBar({ value, tone = "cyan" }: { value: number; tone?: "cyan" | "violet" | "amber" | "red" }) {
  const color = tone === "violet" ? VIOLET : tone === "amber" ? AMBER : tone === "red" ? DANGER : ACCENT;
  return (
    <View style={styles.confidenceRow}>
      <View style={styles.confidenceTrack}><View style={[styles.confidenceFill, { width: `${value}%`, backgroundColor: color }]} /></View>
      <Text style={[styles.confidenceValue, { color }]}>{value}%</Text>
    </View>
  );
}

export function SignalMap({ nodes, onPress }: { nodes: EntityNode[]; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.mapCard, pressed && styles.pressed]} accessibilityLabel="Open global investigation map">
      <View style={styles.mapHeader}><View><Text style={styles.mapEyebrow}>GLOBAL INVESTIGATION MAP</Text><Text style={styles.mapTitle}>Northstar network</Text></View><View style={styles.mapLive}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View></View>
      <View style={styles.mapCanvas}>
        <View style={styles.globeRing} /><View style={[styles.globeRing, styles.globeRingInner]} />
        <View style={styles.mapLineOne} /><View style={styles.mapLineTwo} /><View style={styles.mapLineThree} />
        {nodes.map((node) => <View key={node.id} style={[styles.mapNode, { left: `${node.x}%`, top: `${node.y}%`, backgroundColor: node.color, shadowColor: node.color }]}><View style={styles.mapNodeCore} /></View>)}
        <View style={styles.mapLegend}><Text style={styles.mapLegendText}>5 entities</Text><Text style={styles.mapLegendText}>7 signals</Text><Text style={[styles.mapLegendText, { color: AMBER }]}>2 review</Text></View>
      </View>
    </Pressable>
  );
}

export function EmptyState({ title, body, action, onPress }: { title: string; body: string; action?: string; onPress?: () => void }) {
  return <View style={styles.emptyState}><MaterialIcons name="radar" size={26} color={C.muted} /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text>{action && onPress ? <Pressable onPress={onPress} style={styles.emptyAction}><Text style={styles.emptyActionText}>{action}</Text></Pressable> : null}</View>;
}

export function AuditRow({ event }: { event: AuditEvent }) {
  const color = event.tone === "violet" ? VIOLET : event.tone === "amber" ? AMBER : ACCENT;
  return <View style={styles.auditRow}><View style={[styles.auditDot, { backgroundColor: color }]} /><View style={styles.auditCopy}><Text style={styles.auditAction}><Text style={styles.auditActor}>{event.actor}</Text> {event.action}</Text><Text style={styles.auditTime}>{event.timestamp} · append-only event</Text></View></View>;
}

export function BottomAction({ icon, label, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.bottomAction, pressed && styles.pressed]}><MaterialIcons name={icon} size={19} color={ACCENT} /><Text style={styles.bottomActionText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18 },
  headerCopy: { flex: 1, paddingRight: 16 },
  eyebrow: { color: ACCENT, fontSize: 10, fontWeight: "800", letterSpacing: 1.7, marginBottom: 7 },
  title: { color: C.foreground, fontSize: 29, fontWeight: "800", letterSpacing: -0.7 },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 18, marginTop: 6, maxWidth: 330 },
  headerAction: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", backgroundColor: C.surface },
  sectionRow: { flexDirection: "row", alignItems: "center", minHeight: 30, marginBottom: 11 },
  sectionTitleWrap: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  sectionTitle: { color: C.foreground, fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  sectionMeta: { color: C.muted, fontSize: 11, fontWeight: "700", letterSpacing: 0.4, marginRight: 7 },
  card: { backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16 },
  cardAccent: { borderColor: `${ACCENT}55`, backgroundColor: "#0E252A" },
  cardViolet: { borderColor: `${VIOLET}55`, backgroundColor: "#17162A" },
  cardWarning: { borderColor: `${AMBER}55`, backgroundColor: "#251F12" },
  cardDanger: { borderColor: `${DANGER}55`, backgroundColor: "#2A151C" },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  statusBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 100, paddingHorizontal: 9, paddingVertical: 5 },
  statusBadgeCompact: { paddingHorizontal: 7, paddingVertical: 3, gap: 3 },
  statusText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  statusTextCompact: { fontSize: 9 },
  tinyTag: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 },
  tinyTagText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.25 },
  statTile: { flex: 1, minHeight: 92, padding: 13, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  statLabel: { color: C.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  statValue: { fontSize: 25, fontWeight: "800", marginTop: 8 },
  statDetail: { color: C.muted, fontSize: 10, marginTop: 1 },
  progressTrack: { height: 6, borderRadius: 6, overflow: "hidden", backgroundColor: "#253145" },
  progressFill: { height: "100%", borderRadius: 6 },
  confidenceRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 12 },
  confidenceTrack: { flex: 1, height: 5, borderRadius: 8, backgroundColor: "#263449", overflow: "hidden" },
  confidenceFill: { height: "100%", borderRadius: 8 },
  confidenceValue: { width: 37, fontSize: 11, fontWeight: "900", textAlign: "right" },
  mapCard: { marginBottom: 22, borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: `${ACCENT}44`, backgroundColor: "#0C1722" },
  mapHeader: { paddingHorizontal: 16, paddingTop: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  mapEyebrow: { color: ACCENT, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  mapTitle: { color: C.foreground, fontSize: 17, fontWeight: "800", marginTop: 4 },
  mapLive: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: `${ACCENT}44`, backgroundColor: `${ACCENT}12`, borderRadius: 100, paddingHorizontal: 7, paddingVertical: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 6, backgroundColor: ACCENT },
  liveText: { color: ACCENT, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  mapCanvas: { height: 224, marginTop: 8, position: "relative", overflow: "hidden" },
  globeRing: { position: "absolute", width: 250, height: 250, borderRadius: 250, borderWidth: 1, borderColor: `${ACCENT}1F`, left: "50%", top: 0, marginLeft: -125 },
  globeRingInner: { width: 158, height: 250, marginLeft: -79, borderColor: `${VIOLET}26` },
  mapLineOne: { position: "absolute", left: "23%", top: "42%", width: "54%", height: 1, backgroundColor: `${ACCENT}44`, transform: [{ rotate: "-17deg" }] },
  mapLineTwo: { position: "absolute", left: "23%", top: "46%", width: "54%", height: 1, backgroundColor: `${VIOLET}55`, transform: [{ rotate: "25deg" }] },
  mapLineThree: { position: "absolute", left: "27%", top: "42%", width: "47%", height: 1, backgroundColor: `${AMBER}44`, transform: [{ rotate: "55deg" }] },
  mapNode: { position: "absolute", width: 15, height: 15, marginLeft: -7, marginTop: -7, borderRadius: 15, alignItems: "center", justifyContent: "center", shadowOpacity: 0.8, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  mapNodeCore: { width: 5, height: 5, borderRadius: 5, backgroundColor: "#FFFFFF" },
  mapLegend: { position: "absolute", left: 16, right: 16, bottom: 14, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: `${ACCENT}1F`, paddingTop: 9 },
  mapLegendText: { color: C.muted, fontSize: 10, fontWeight: "700" },
  emptyState: { alignItems: "center", padding: 30, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  emptyTitle: { color: C.foreground, fontSize: 16, fontWeight: "800", marginTop: 12 },
  emptyBody: { color: C.muted, fontSize: 13, lineHeight: 18, textAlign: "center", marginTop: 6, maxWidth: 280 },
  emptyAction: { marginTop: 16, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: `${ACCENT}18`, borderWidth: 1, borderColor: `${ACCENT}44` },
  emptyActionText: { color: ACCENT, fontSize: 12, fontWeight: "800" },
  auditRow: { flexDirection: "row", gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: `${C.border}99` },
  auditDot: { width: 8, height: 8, borderRadius: 8, marginTop: 4 },
  auditCopy: { flex: 1 },
  auditAction: { color: C.foreground, fontSize: 12, lineHeight: 17 },
  auditActor: { fontWeight: "800" },
  auditTime: { color: C.muted, fontSize: 10, marginTop: 3 },
  bottomAction: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, minHeight: 46, backgroundColor: `${ACCENT}13`, borderWidth: 1, borderColor: `${ACCENT}44` },
  bottomActionText: { color: ACCENT, fontSize: 12, fontWeight: "800" },
});

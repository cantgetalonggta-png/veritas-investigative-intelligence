import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { type Href, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Card, C, ConfidenceBar, ScreenHeader, SectionTitle, SignalMap, StatTile, TinyTag, ACCENT, AMBER, VIOLET } from "@/components/veritas-ui";
import { currentCase, nodes } from "@/shared/investigation-data";

export default function HomeScreen() {
  const router = useRouter();
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [researchQuery, setResearchQuery] = useState("");
  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="VERITAS / FIELD DESK"
          title="Good evening, Maya"
          subtitle="Your case desk is quiet. The signal is not."
          action={{ label: "Open security status", icon: "shield", onPress: () => setBriefingOpen((value) => !value) }}
        />
        <View style={styles.researchBox}><MaterialIcons name="search" size={19} color={ACCENT} /><TextInput value={researchQuery} onChangeText={setResearchQuery} onSubmitEditing={() => researchQuery.trim().length >= 2 && router.push((`/search?query=${encodeURIComponent(researchQuery.trim())}`) as Href)} placeholder="Search a person or business in public records" placeholderTextColor={C.muted} style={styles.researchInput} returnKeyType="search" /><Pressable onPress={() => researchQuery.trim().length >= 2 && router.push((`/search?query=${encodeURIComponent(researchQuery.trim())}`) as Href)} style={styles.researchButton}><MaterialIcons name="arrow-forward" size={18} color="#061117" /></Pressable></View>
        <Text style={styles.researchHint}>Wikidata · SEC EDGAR · GDELT news · connected public posts</Text>
        {briefingOpen ? (
          <Card tone="accent" style={styles.securityCard}>
            <View style={styles.securityHeader}><View style={styles.securityIcon}><MaterialIcons name="verified-user" size={18} color={ACCENT} /></View><View style={styles.securityCopy}><Text style={styles.securityTitle}>Workspace protected</Text><Text style={styles.securityBody}>Demo mode · production key management is a backend integration.</Text></View><MaterialIcons name="close" size={18} color={C.muted} /></View>
            <View style={styles.securityChecks}><Text style={styles.securityCheck}>● Case scope isolated</Text><Text style={styles.securityCheck}>● Audit logging on</Text><Text style={[styles.securityCheck, { color: AMBER }]}>● 1 consent hold</Text></View>
          </Card>
        ) : null}
        <Card tone="accent" style={styles.caseCard}>
          <View style={styles.caseTop}><View><Text style={styles.caseLabel}>ACTIVE INVESTIGATION</Text><Text style={styles.caseName}>{currentCase.name}</Text></View><View style={styles.caseBadge}><View style={styles.caseDot} /><Text style={styles.caseBadgeText}>LIVE</Text></View></View>
          <Text style={styles.caseDescription}>{currentCase.description}</Text>
          <View style={styles.caseProgressRow}><Text style={styles.caseProgressLabel}>CASE SIGNAL COVERAGE</Text><Text style={styles.caseProgressValue}>{currentCase.progress}%</Text></View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${currentCase.progress}%` }]} /></View>
          <View style={styles.caseMeta}><Text style={styles.caseMetaText}>Updated 2m ago</Text><Text style={styles.caseMetaText}>{currentCase.status}</Text></View>
        </Card>
        <View style={styles.quickRow}>
          <QuickAction icon="add-circle-outline" label="New case" onPress={() => setBriefingOpen(true)} />
          <QuickAction icon="file-upload" label="Import" onPress={() => router.push("/vault")} />
          <QuickAction icon="radar" label="View leads" onPress={() => router.push("/analysis")} />
        </View>
        <SignalMap nodes={nodes} onPress={() => router.push("/analysis")} />
        <View style={styles.statsRow}>
          <StatTile label="Sources" value={`${currentCase.sources}`} detail="indexed" tone="cyan" />
          <StatTile label="Entities" value={`${currentCase.entities}`} detail="linked" tone="violet" />
          <StatTile label="Signals" value={`${currentCase.signals}`} detail="to review" tone="amber" />
        </View>
        <View style={styles.sectionBlock}><SectionTitle title="Signal feed" meta="LIVE" icon="flash-on" />
          <Card style={styles.feedCard}>
            <FeedRow icon="hub" color={ACCENT} title="Director overlap detected" body="Northstar Marine ↔ Harbor Civic" time="2m ago" />
            <FeedRow icon="schedule" color={VIOLET} title="Payment cadence breaks pattern" body="3 transfers before milestones" time="18m ago" />
            <FeedRow icon="priority-high" color={AMBER} title="Consent review required" body="Private contact export quarantined" time="1h ago" last />
          </Card>
        </View>
        <View style={styles.sectionBlock}><SectionTitle title="Copilot brief" meta="ASSISTIVE" icon="auto-awesome" />
          <Card tone="violet" onPress={() => router.push("/copilot")}>
            <View style={styles.copilotRow}><View style={styles.copilotOrb}><MaterialIcons name="auto-awesome" size={18} color={VIOLET} /></View><View style={styles.copilotCopy}><Text style={styles.copilotTitle}>One review item needs your attention</Text><Text style={styles.copilotBody}>“The private contact export should remain quarantined until consent is documented.”</Text></View><MaterialIcons name="chevron-right" size={20} color={C.muted} /></View>
            <View style={styles.copilotFooter}><TinyTag tone="violet">HUMAN REVIEW</TinyTag><Text style={styles.copilotConfidence}>96% context confidence</Text></View>
            <ConfidenceBar value={96} tone="violet" />
          </Card>
        </View>
        <View style={styles.footerNote}><MaterialIcons name="lock-outline" size={15} color={C.muted} /><Text style={styles.footerText}>Local fixture workspace · no source data leaves this prototype</Text></View>
      </ScrollView>
    </ScreenContainer>
  );
}

function QuickAction({ icon, label, onPress }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}><MaterialIcons name={icon} size={20} color={ACCENT} /><Text style={styles.quickLabel}>{label}</Text></Pressable>;
}

function FeedRow({ icon, color, title, body, time, last }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; color: string; title: string; body: string; time: string; last?: boolean }) {
  return <View style={[styles.feedRow, last && styles.feedRowLast]}><View style={[styles.feedIcon, { backgroundColor: `${color}16`, borderColor: `${color}44` }]}><MaterialIcons name={icon} size={16} color={color} /></View><View style={styles.feedCopy}><Text style={styles.feedTitle}>{title}</Text><Text style={styles.feedBody}>{body}</Text></View><Text style={styles.feedTime}>{time}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 }, researchBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 20, minHeight: 46, borderRadius: 15, borderWidth: 1, borderColor: `${ACCENT}55`, backgroundColor: C.surface, paddingHorizontal: 12 }, researchInput: { flex: 1, color: C.foreground, fontSize: 11 }, researchButton: { width: 31, height: 31, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: ACCENT }, researchHint: { color: C.muted, fontSize: 9, marginHorizontal: 21, marginTop: 7, marginBottom: 4 }, securityCard: { marginHorizontal: 20, marginBottom: 14, padding: 13 }, securityHeader: { flexDirection: "row", alignItems: "center", gap: 10 }, securityIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: `${ACCENT}16` }, securityCopy: { flex: 1 }, securityTitle: { color: C.foreground, fontSize: 13, fontWeight: "800" }, securityBody: { color: C.muted, fontSize: 10, marginTop: 3 }, securityChecks: { flexDirection: "row", flexWrap: "wrap", gap: 11, marginTop: 12 }, securityCheck: { color: ACCENT, fontSize: 10, fontWeight: "700" }, caseCard: { marginHorizontal: 20, padding: 17 }, caseTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }, caseLabel: { color: ACCENT, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 }, caseName: { color: C.foreground, fontSize: 23, fontWeight: "800", marginTop: 5 }, caseBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: `${ACCENT}45`, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 5 }, caseDot: { width: 6, height: 6, borderRadius: 6, backgroundColor: ACCENT }, caseBadgeText: { color: ACCENT, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, caseDescription: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 12, maxWidth: 320 }, caseProgressRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 18, marginBottom: 7 }, caseProgressLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1 }, caseProgressValue: { color: ACCENT, fontSize: 11, fontWeight: "900" }, progressTrack: { height: 7, borderRadius: 7, overflow: "hidden", backgroundColor: "#253145" }, progressFill: { height: "100%", borderRadius: 7, backgroundColor: ACCENT }, caseMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 }, caseMetaText: { color: C.muted, fontSize: 10 }, quickRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginVertical: 17 }, quickAction: { flex: 1, minHeight: 72, alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }, quickLabel: { color: C.foreground, fontSize: 11, fontWeight: "700" }, pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] }, statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 22 }, sectionBlock: { paddingHorizontal: 20, marginBottom: 22 }, feedCard: { paddingHorizontal: 14, paddingVertical: 2 }, feedRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 68, borderBottomWidth: 1, borderBottomColor: `${C.border}99` }, feedRowLast: { borderBottomWidth: 0 }, feedIcon: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 1 }, feedCopy: { flex: 1 }, feedTitle: { color: C.foreground, fontSize: 12, fontWeight: "800" }, feedBody: { color: C.muted, fontSize: 10, marginTop: 4 }, feedTime: { color: C.muted, fontSize: 9 }, copilotRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 }, copilotOrb: { width: 36, height: 36, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: `${VIOLET}16`, borderWidth: 1, borderColor: `${VIOLET}44` }, copilotCopy: { flex: 1 }, copilotTitle: { color: C.foreground, fontSize: 13, fontWeight: "800" }, copilotBody: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }, copilotFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 }, copilotConfidence: { color: C.muted, fontSize: 10 }, footerNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 20, marginTop: -3 }, footerText: { color: C.muted, fontSize: 10 },
});

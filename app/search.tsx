import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Card, C, ConfidenceBar, ScreenHeader, TinyTag, ACCENT, AMBER, VIOLET } from "@/components/veritas-ui";
import { trpc } from "@/lib/trpc";
import type { ResearchEntityType, ResearchResult } from "@/shared/research";

const filters: { label: string; value: ResearchEntityType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "People", value: "person" },
  { label: "Organizations", value: "organization" },
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ query?: string }>();
  const [query, setQuery] = useState(typeof params.query === "string" ? params.query : "");
  const [submittedQuery, setSubmittedQuery] = useState(query);
  const [filter, setFilter] = useState<ResearchEntityType | "all">("all");
  const [savedLeads, setSavedLeads] = useState<ResearchResult[]>([]);
  const search = trpc.research.search.useQuery({ query: submittedQuery.trim() }, { enabled: submittedQuery.trim().length >= 2, retry: false });
  const templates = trpc.research.templates.useQuery({ subject: submittedQuery.trim(), domains: [] }, { enabled: submittedQuery.trim().length >= 2, retry: false });
  const domainQuery = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(submittedQuery.trim());
  const historical = trpc.research.historical.useQuery({ domain: submittedQuery.trim() }, { enabled: domainQuery, retry: false });
  const filtered = useMemo(() => filter === "all" ? search.data?.results ?? [] : (search.data?.results ?? []).filter((result) => result.entityType === filter), [filter, search.data?.results]);

  useEffect(() => {
    AsyncStorage.getItem("veritas.saved-research-leads").then((value) => {
      if (!value) return;
      try { setSavedLeads(JSON.parse(value) as ResearchResult[]); } catch { setSavedLeads([]); }
    });
  }, []);

  const toggleSaved = async (result: ResearchResult) => {
    const next = savedLeads.some((lead) => lead.id === result.id) ? savedLeads.filter((lead) => lead.id !== result.id) : [...savedLeads, result];
    setSavedLeads(next);
    await AsyncStorage.setItem("veritas.saved-research-leads", JSON.stringify(next));
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader eyebrow="PUBLIC RESEARCH / 01" title="Search the open record" subtitle="Cross-check public sources before you form a lead." action={{ label: "Back to field desk", icon: "arrow-back", onPress: () => router.back() }} />
        <View style={styles.searchBox}><MaterialIcons name="search" size={20} color={ACCENT} /><TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => setSubmittedQuery(query)} placeholder="Name, company, ticker, or domain" placeholderTextColor={C.muted} style={styles.input} returnKeyType="search" /><Pressable onPress={() => setSubmittedQuery(query)} style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}><MaterialIcons name="arrow-forward" size={18} color="#061117" /></Pressable></View>
        <View style={styles.boundary}><MaterialIcons name="public" size={14} color={ACCENT} /><Text style={styles.boundaryText}>Public web and records only · every result keeps its source link</Text></View>
        <Pressable onPress={() => Linking.openURL("/engines.html")} style={({ pressed }) => [styles.engineLink, pressed && styles.pressed]}>
          <MaterialIcons name="travel-explore" size={16} color={VIOLET} />
          <Text style={styles.engineLinkText}>259 investigation search engines · auto terms</Text>
          <MaterialIcons name="chevron-right" size={16} color={C.muted} />
        </Pressable>
        {templates.data?.length ? <View style={styles.templateBlock}><Text style={styles.templateTitle}>SAFE RESEARCH PATTERNS</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateRow}>{templates.data.map((template) => <View key={template.label} style={styles.templateCard}><Text style={styles.templateLabel}>{template.label}</Text><Text style={styles.templateQuery} numberOfLines={2}>{template.query}</Text></View>)}</ScrollView><Text style={styles.templateNote}>Provider syntax varies. These patterns exclude credential, private-access, and infrastructure-targeting searches.</Text></View> : null}
        {search.isFetching ? <Card style={styles.loading}><ActivityIndicator color={ACCENT} /><Text style={styles.loadingText}>Searching public sources in parallel…</Text></Card> : null}
        {search.error ? <Card tone="danger" style={styles.error}><MaterialIcons name="error-outline" size={18} color="#FB7185" /><Text style={styles.errorText}>The lookup could not complete. Try again or broaden the query.</Text></Card> : null}
        {search.data ? <><View style={styles.resultMeta}><View><Text style={styles.eyebrow}>SEARCHED {new Date(search.data.searchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text><Text style={styles.resultTitle}>{search.data.results.length} public matches</Text></View><TinyTag tone="cyan">{search.data.sources.length} SOURCES</TinyTag></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{filters.map((item) => <Pressable key={item.value} onPress={() => setFilter(item.value)} style={[styles.filter, filter === item.value && styles.filterActive]}><Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>{item.label}</Text></Pressable>)}</ScrollView>{savedLeads.length ? <Text style={styles.savedCount}>{savedLeads.length} lead{savedLeads.length === 1 ? "" : "s"} saved on this device</Text> : null}{search.data.warnings.map((warning) => <View key={warning} style={styles.warning}><MaterialIcons name="info-outline" size={14} color={AMBER} /><Text style={styles.warningText}>{warning}</Text></View>)}<View style={styles.results}>{filtered.map((result) => <ResearchCard key={result.id} result={result} saved={savedLeads.some((lead) => lead.id === result.id)} onToggleSaved={() => toggleSaved(result)} />)}</View>{historical.data?.results.length ? <><Text style={styles.historicalTitle}>HISTORICAL INDEX LEADS</Text><Text style={styles.historicalNote}>Indexed URLs are discovery leads, not proof of document contents.</Text><View style={styles.results}>{historical.data.results.map((result) => <ResearchCard key={result.id} result={result} saved={savedLeads.some((lead) => lead.id === result.id)} onToggleSaved={() => toggleSaved(result)} />)}</View></> : null}{filtered.length === 0 ? <View style={styles.empty}><MaterialIcons name="manage-search" size={27} color={C.muted} /><Text style={styles.emptyTitle}>No matches in this filter</Text><Text style={styles.emptyBody}>Try All or search the full legal name.</Text></View> : null}</> : <Card tone="violet" style={styles.startCard}><MaterialIcons name="travel-explore" size={24} color={VIOLET} /><Text style={styles.startTitle}>Start with a public identity</Text><Text style={styles.startBody}>Search a person, business, ticker, or domain. Veritas queries public entity records, SEC registrants, news coverage, and connected public-post search without pulling private contact data.</Text></Card>}
        <Text style={styles.disclaimer}>Research output is a lead list, not a finding. Confirm identity, date, context, and source reliability before adding anything to a case.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function ResearchCard({ result, saved, onToggleSaved }: { result: ResearchResult; saved: boolean; onToggleSaved: () => void }) {
  return <Card style={styles.resultCard}><View style={styles.resultTop}><View style={styles.sourceRow}><View style={[styles.sourceIcon, { backgroundColor: result.source === "SEC EDGAR" ? `${AMBER}18` : `${ACCENT}18` }]}><MaterialIcons name={result.source === "SEC EDGAR" ? "account-balance" : result.source === "GDELT News" ? "newspaper" : result.source === "X Public Posts" ? "forum" : "public"} size={16} color={result.source === "SEC EDGAR" ? AMBER : ACCENT} /></View><View style={styles.resultCopy}><Text style={styles.resultCardTitle} numberOfLines={2}>{result.title}</Text><Text style={styles.sourceName}>{result.source} · {result.entityType}</Text></View></View><Pressable onPress={onToggleSaved} accessibilityLabel={saved ? "Remove saved lead" : "Save lead"}><MaterialIcons name={saved ? "bookmark" : "bookmark-border"} size={19} color={saved ? VIOLET : C.muted} /></Pressable></View><Text style={styles.summary}>{result.summary}</Text><View style={styles.provenance}><TinyTag tone={result.source === "SEC EDGAR" ? "amber" : "cyan"}>{saved ? "SAVED LEAD" : result.provenance}</TinyTag>{result.publishedAt ? <Text style={styles.date}>{result.publishedAt}</Text> : null}</View><ConfidenceBar value={result.confidence} tone={result.source === "SEC EDGAR" ? "amber" : "cyan"} /><Text style={styles.url}>{result.url}</Text></Card>;
}

const styles = StyleSheet.create({ content: { paddingBottom: 32 }, eyebrow: { color: ACCENT, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 }, searchBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 20, paddingHorizontal: 12, minHeight: 48, borderRadius: 15, borderWidth: 1, borderColor: `${ACCENT}55`, backgroundColor: C.surface }, input: { flex: 1, color: C.foreground, fontSize: 12 }, searchButton: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: ACCENT }, pressed: { opacity: 0.75 }, boundary: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 21, marginTop: 10, marginBottom: 16 }, boundaryText: { color: C.muted, fontSize: 10 }, templateBlock: { marginHorizontal: 20, marginBottom: 16 }, templateTitle: { color: VIOLET, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginBottom: 8 }, templateRow: { gap: 8 }, templateCard: { width: 188, padding: 11, borderRadius: 13, borderWidth: 1, borderColor: `${VIOLET}44`, backgroundColor: `${VIOLET}0D` }, templateLabel: { color: C.foreground, fontSize: 10, fontWeight: "800" }, templateQuery: { color: C.muted, fontSize: 9, lineHeight: 13, marginTop: 6 }, templateNote: { color: C.muted, fontSize: 9, lineHeight: 13, marginTop: 7 }, loading: { marginHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 9 }, loadingText: { color: C.muted, fontSize: 11 }, error: { marginHorizontal: 20, flexDirection: "row", gap: 9, alignItems: "center" }, errorText: { flex: 1, color: "#FDA4AF", fontSize: 11, lineHeight: 16 }, resultMeta: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 5, marginBottom: 11 }, resultTitle: { color: C.foreground, fontSize: 19, fontWeight: "800", marginTop: 5 }, filterRow: { gap: 7, paddingHorizontal: 20, paddingBottom: 13 }, filter: { borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7 }, filterActive: { borderColor: `${ACCENT}66`, backgroundColor: `${ACCENT}13` }, filterText: { color: C.muted, fontSize: 10, fontWeight: "700" }, filterTextActive: { color: ACCENT }, savedCount: { color: VIOLET, fontSize: 9, fontWeight: "800", paddingHorizontal: 20, marginBottom: 8 }, historicalTitle: { color: AMBER, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, paddingHorizontal: 20, marginTop: 18 }, historicalNote: { color: C.muted, fontSize: 9, paddingHorizontal: 20, marginTop: 5, marginBottom: 9 }, warning: { flexDirection: "row", gap: 6, paddingHorizontal: 20, marginBottom: 9 }, warningText: { flex: 1, color: AMBER, fontSize: 10, lineHeight: 15 }, results: { gap: 10, paddingHorizontal: 20 }, resultCard: { padding: 13 }, resultTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }, sourceRow: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 }, sourceIcon: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" }, resultCopy: { flex: 1 }, resultCardTitle: { color: C.foreground, fontSize: 12, fontWeight: "800" }, sourceName: { color: C.muted, fontSize: 9, marginTop: 3, textTransform: "uppercase" }, summary: { color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 11 }, provenance: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 11 }, date: { flex: 1, color: C.muted, fontSize: 9, textAlign: "right" }, url: { color: `${ACCENT}CC`, fontSize: 9, marginTop: 7 }, startCard: { marginHorizontal: 20, padding: 17 }, startTitle: { color: C.foreground, fontSize: 15, fontWeight: "800", marginTop: 12 }, startBody: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 6 }, empty: { alignItems: "center", padding: 28, marginHorizontal: 20, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }, emptyTitle: { color: C.foreground, fontSize: 15, fontWeight: "800", marginTop: 10 }, emptyBody: { color: C.muted, fontSize: 11, marginTop: 5 }, disclaimer: { color: C.muted, fontSize: 9, lineHeight: 14, textAlign: "center", paddingHorizontal: 24, marginTop: 17 },
  engineLink: { marginHorizontal: 20, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 13, borderWidth: 1, borderColor: `${VIOLET}55`, backgroundColor: `${VIOLET}12` },
  engineLinkText: { flex: 1, color: C.foreground, fontSize: 11, fontWeight: "800" },
});

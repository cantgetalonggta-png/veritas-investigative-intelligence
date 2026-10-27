import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Card, C, ScreenHeader, TinyTag, ACCENT, AMBER, VIOLET } from "@/components/veritas-ui";
import {
  SEARCH_ENGINES,
  SEARCH_ENGINES_COUNT,
  SEARCH_ENGINE_POLICY,
  developAllSearchTerms,
} from "@/shared/search-engines-catalog";

const types = Array.from(new Set(SEARCH_ENGINES.map((e) => e.type))).sort();

export default function EnginesScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [org, setOrg] = useState("");
  const [keyword, setKeyword] = useState("procurement");
  const [type, setType] = useState<string>("");
  const [runKey, setRunKey] = useState(0);

  const plans = useMemo(() => {
    const base = developAllSearchTerms({
      subject: subject.trim() || "SUBJECT",
      org: org.trim() || "ORG",
      keyword: keyword.trim() || "investigation",
      year: "2026",
    });
    return type ? base.filter((p) => p.type === type) : base;
  }, [subject, org, keyword, type, runKey]);

  const totalTerms = plans.reduce((n, p) => n + p.terms.length, 0);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="ENGINE MESH / 02"
          title="Investigation search engines"
          subtitle={`${SEARCH_ENGINES_COUNT} engines · auto-developed terms · public records only`}
          action={{ label: "Back", icon: "arrow-back", onPress: () => router.back() }}
        />
        <Card style={styles.policy}>
          <Text style={styles.policyText}>
            Policy: public records only · no minors/victim exposure · AI answers are leads until primary-source verified
            {SEARCH_ENGINE_POLICY.verify_with_primary_sources ? " · verify primary sources" : ""}
          </Text>
        </Card>
        <View style={styles.row}>
          <TextInput value={subject} onChangeText={setSubject} placeholder="Subject" placeholderTextColor={C.muted} style={styles.input} />
          <TextInput value={org} onChangeText={setOrg} placeholder="Organization" placeholderTextColor={C.muted} style={styles.input} />
        </View>
        <View style={styles.row}>
          <TextInput value={keyword} onChangeText={setKeyword} placeholder="Keyword" placeholderTextColor={C.muted} style={styles.input} />
          <Pressable onPress={() => setRunKey((k) => k + 1)} style={styles.btn}>
            <Text style={styles.btnText}>Develop terms</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <Pressable onPress={() => setType("")} style={[styles.chip, !type && styles.chipOn]}><Text style={styles.chipText}>All</Text></Pressable>
          {types.map((t) => (
            <Pressable key={t} onPress={() => setType(t)} style={[styles.chip, type === t && styles.chipOn]}>
              <Text style={styles.chipText}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.meta}>
          <TinyTag tone="cyan">{plans.length} ENGINES</TinyTag>
          <TinyTag tone="violet">{totalTerms} TERMS</TinyTag>
          <Pressable onPress={() => Linking.openURL("/engines.html")}><TinyTag tone="amber">OPEN WEB UI</TinyTag></Pressable>
        </View>
        <View style={styles.list}>
          {plans.slice(0, 80).map((p) => (
            <Card key={p.engine} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.engine}>{p.engine}</Text>
                <TinyTag tone="cyan">{p.type}</TinyTag>
              </View>
              <Text style={styles.site} numberOfLines={1}>{p.website}</Text>
              {p.terms.slice(0, 4).map((term) => (
                <Text key={term} style={styles.term} numberOfLines={3}>{term}</Text>
              ))}
              {p.terms.length > 4 ? <Text style={styles.more}>+{p.terms.length - 4} more terms</Text> : null}
            </Card>
          ))}
          {plans.length > 80 ? (
            <Text style={styles.more}>Showing 80 of {plans.length}. Use /engines.html for full mesh + export.</Text>
          ) : null}
        </View>
        <Text style={styles.disclaimer}>Leads only. Confirm identity, date, context, and source reliability before case entry.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  policy: { marginHorizontal: 20, marginBottom: 12, borderColor: `${AMBER}44` },
  policyText: { color: AMBER, fontSize: 10, lineHeight: 15 },
  row: { flexDirection: "row", gap: 8, marginHorizontal: 20, marginBottom: 8 },
  input: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, color: C.foreground, paddingHorizontal: 12, fontSize: 12 },
  btn: { backgroundColor: ACCENT, borderRadius: 12, paddingHorizontal: 14, justifyContent: "center" },
  btnText: { color: "#061117", fontWeight: "900", fontSize: 11 },
  filters: { gap: 7, paddingHorizontal: 20, paddingBottom: 12 },
  chip: { borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 7 },
  chipOn: { borderColor: `${ACCENT}66`, backgroundColor: `${ACCENT}13` },
  chipText: { color: C.muted, fontSize: 10, fontWeight: "700" },
  meta: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 10, alignItems: "center" },
  list: { gap: 10, paddingHorizontal: 20 },
  card: { padding: 12 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  engine: { flex: 1, color: C.foreground, fontSize: 13, fontWeight: "800" },
  site: { color: C.muted, fontSize: 9, marginTop: 4 },
  term: { color: C.foreground, fontSize: 10, lineHeight: 14, marginTop: 6, padding: 8, borderRadius: 8, backgroundColor: `${ACCENT}0A`, borderWidth: 1, borderColor: C.border },
  more: { color: VIOLET, fontSize: 10, marginTop: 8, textAlign: "center" },
  disclaimer: { color: C.muted, fontSize: 9, lineHeight: 14, textAlign: "center", paddingHorizontal: 24, marginTop: 16 },
});

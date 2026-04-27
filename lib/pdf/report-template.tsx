import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { KPI_AREA_LABELS, KpiArea } from '@/lib/types'

// ─── Colours (Arie Finance brand) ────────────────────────────────────────────

const NAVY = '#0A1628'
const GOLD = '#C9A84C'
const GOLD_LIGHT = '#e0c06a'
const BODY_TEXT = '#1A1A2E'
const WHITE = '#FFFFFF'
const LIGHT_GREY = '#F5F5F5'
const SUCCESS = '#2D6A4F'
const SUCCESS_BG = '#E8F5EE'
const DANGER = '#C0392B'
const DANGER_BG = '#FDF0EE'
const MUTED = '#666677'

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: BODY_TEXT,
    backgroundColor: WHITE,
    paddingBottom: 40,
  },
  // Header
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 32,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBrand: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    letterSpacing: 2,
  },
  headerSub: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5,
  },
  // Gold separator
  goldBar: {
    height: 2,
    backgroundColor: GOLD,
  },
  // Body
  body: {
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  // Title block
  reportTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 4,
  },
  reportByline: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 2,
  },
  reportDate: {
    fontSize: 8,
    color: MUTED,
    marginBottom: 20,
  },
  // Executive summary box
  execSummaryBox: {
    backgroundColor: LIGHT_GREY,
    borderRadius: 4,
    padding: 14,
    marginBottom: 24,
  },
  execSummaryLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  execSummaryText: {
    fontSize: 9.5,
    color: BODY_TEXT,
    lineHeight: 1.6,
  },
  // Section
  sectionHeader: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: GOLD,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  // KPI grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 24,
  },
  kpiTile: {
    width: '22%',
    backgroundColor: LIGHT_GREY,
    borderRadius: 4,
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
  },
  kpiTileName: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 4,
    lineHeight: 1.3,
  },
  kpiTileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  kpiTileLabel: {
    fontSize: 6.5,
    color: MUTED,
  },
  kpiTileValue: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
  },
  // Win item
  winItem: {
    borderLeftWidth: 2,
    borderLeftColor: SUCCESS,
    paddingLeft: 10,
    marginBottom: 10,
  },
  winTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 2,
  },
  winMeta: {
    fontSize: 7.5,
    color: MUTED,
    marginBottom: 3,
  },
  winChange: {
    fontSize: 8.5,
    color: BODY_TEXT,
    lineHeight: 1.5,
  },
  winBadge: {
    backgroundColor: SUCCESS_BG,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  winBadgeText: {
    fontSize: 7,
    color: SUCCESS,
    fontFamily: 'Helvetica-Bold',
  },
  winShoutout: {
    fontSize: 7.5,
    color: MUTED,
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Risk item
  riskItem: {
    borderLeftWidth: 2,
    borderLeftColor: DANGER,
    paddingLeft: 10,
    marginBottom: 10,
  },
  riskDesc: {
    fontSize: 8.5,
    color: BODY_TEXT,
    marginBottom: 2,
    lineHeight: 1.5,
  },
  riskMeta: {
    fontSize: 7.5,
    color: MUTED,
  },
  riskBadge: {
    backgroundColor: DANGER_BG,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  riskBadgeText: {
    fontSize: 7,
    color: DANGER,
    fontFamily: 'Helvetica-Bold',
  },
  // In progress
  inProgressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  inProgressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD,
  },
  inProgressText: {
    fontSize: 8.5,
    color: BODY_TEXT,
    flex: 1,
  },
  inProgressStatus: {
    fontSize: 7,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // KPI section
  kpiSection: {
    marginBottom: 12,
  },
  kpiSectionName: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 3,
  },
  kpiSectionText: {
    fontSize: 8.5,
    color: BODY_TEXT,
    lineHeight: 1.6,
  },
  // ROI strip
  roiStrip: {
    backgroundColor: NAVY,
    borderRadius: 4,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  roiTile: {
    alignItems: 'center',
  },
  roiValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    marginBottom: 2,
  },
  roiLabel: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  // Narrative prose
  narrativeText: {
    fontSize: 9.5,
    color: BODY_TEXT,
    lineHeight: 1.7,
    marginBottom: 8,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: NAVY,
    paddingHorizontal: 32,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.3,
  },
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PDFReportData {
  weekNumber: number
  year: number
  rangeLabel: string
  generatedAt: string
  narrativeMd: string | null
  execSummary: string
  roiMetrics: {
    totalHoursSaved: number
    hoursThisMonth: number
    automationRate: number
    openHighUrgency: number
  }
  kpiTiles: Array<{
    kpi: KpiArea
    open: number
    resolved: number
    hoursSaved: number
  }>
  topWins: Array<{
    title: string
    department: string
    hoursSaved: number | null
    before: string | null
    after: string | null
    shoutout: string | null
    whatChanged: string
  }>
  topRisks: Array<{
    description: string
    department: string
    daysOpen: number
    urgency: number | null
    affectsClient: boolean
    involvesMoney: boolean
  }>
  inProgress: Array<{
    title: string
    status: string
    toolUsed: string | null
  }>
  kpiBreakdown: Array<{
    kpi: KpiArea
    notes: string
  }>
}

// ─── Helper to parse narrative into sections ─────────────────────────────────

function extractSection(markdown: string, heading: string): string {
  const regex = new RegExp(`## ${heading}[\\s\\S]*?(?=##|$)`)
  const match = markdown.match(regex)
  if (!match) return ''
  return match[0]
    .replace(`## ${heading}`, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^-\s/gm, '• ')
    .trim()
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

export function ReportPDF({ data }: { data: PDFReportData }) {
  const today = new Date(data.generatedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Parse AI narrative sections if available
  const execSummary = data.narrativeMd
    ? extractSection(data.narrativeMd, 'Executive Summary')
    : data.execSummary
  const kpiNarrative = data.narrativeMd
    ? extractSection(data.narrativeMd, 'KPI Breakdown')
    : ''
  const riskNarrative = data.narrativeMd
    ? extractSection(data.narrativeMd, 'Top 3 Risks')
    : ''

  return (
    <Document>
      {/* ── Page 1 ── */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerBrand}>ARIE FINANCE</Text>
            <Text style={styles.headerSub}>Internal Operations Intelligence</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.headerSub, { color: 'rgba(255,255,255,0.45)', fontSize: 7 }]}>
              CONFIDENTIAL
            </Text>
          </View>
        </View>
        <View style={styles.goldBar} />

        <View style={styles.body}>
          {/* Title block */}
          <Text style={styles.reportTitle}>
            Weekly Operations Report — Week {data.weekNumber}, {data.year}
          </Text>
          <Text style={styles.reportByline}>Prepared by Ismael, AI &amp; Automation Lead</Text>
          <Text style={styles.reportDate}>Generated: {today} · Period: {data.rangeLabel}</Text>

          {/* Executive Summary */}
          {execSummary ? (
            <View style={styles.execSummaryBox}>
              <Text style={styles.execSummaryLabel}>Executive Summary</Text>
              <Text style={styles.execSummaryText}>{execSummary}</Text>
            </View>
          ) : null}

          {/* ROI Strip */}
          <View style={styles.roiStrip}>
            <View style={styles.roiTile}>
              <Text style={styles.roiValue}>{data.roiMetrics.totalHoursSaved.toFixed(0)}h</Text>
              <Text style={styles.roiLabel}>Total hours{'\n'}saved (all time)</Text>
            </View>
            <View style={styles.roiTile}>
              <Text style={styles.roiValue}>{data.roiMetrics.hoursThisMonth.toFixed(0)}h</Text>
              <Text style={styles.roiLabel}>Hours saved{'\n'}this period</Text>
            </View>
            <View style={styles.roiTile}>
              <Text style={styles.roiValue}>{data.roiMetrics.automationRate.toFixed(0)}%</Text>
              <Text style={styles.roiLabel}>Automation{'\n'}rate</Text>
            </View>
            <View style={styles.roiTile}>
              <Text style={styles.roiValue}>{data.roiMetrics.openHighUrgency}</Text>
              <Text style={styles.roiLabel}>Open high-{'\n'}urgency items</Text>
            </View>
          </View>

          {/* KPI Grid */}
          <Text style={styles.sectionHeader}>KPI Health Overview</Text>
          <View style={styles.kpiGrid}>
            {data.kpiTiles.map((tile) => (
              <View key={tile.kpi} style={styles.kpiTile}>
                <Text style={styles.kpiTileName}>
                  {KPI_AREA_LABELS[tile.kpi] ?? tile.kpi}
                </Text>
                <View style={styles.kpiTileRow}>
                  <Text style={styles.kpiTileLabel}>Open</Text>
                  <Text style={styles.kpiTileValue}>{tile.open}</Text>
                </View>
                <View style={styles.kpiTileRow}>
                  <Text style={styles.kpiTileLabel}>Resolved</Text>
                  <Text style={styles.kpiTileValue}>{tile.resolved}</Text>
                </View>
                {tile.hoursSaved > 0 && (
                  <View style={styles.kpiTileRow}>
                    <Text style={styles.kpiTileLabel}>Saved</Text>
                    <Text style={[styles.kpiTileValue, { color: SUCCESS }]}>
                      {tile.hoursSaved.toFixed(1)}h
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Top 3 Wins */}
          {data.topWins.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>Top Wins</Text>
              {data.topWins.slice(0, 3).map((win, i) => (
                <View key={i} style={styles.winItem}>
                  <Text style={styles.winTitle}>{win.title}</Text>
                  <Text style={styles.winMeta}>From the {win.department} team</Text>
                  <Text style={styles.winChange}>{win.whatChanged}</Text>
                  {win.before && win.after && (
                    <Text style={[styles.winMeta, { marginTop: 2 }]}>
                      Before: {win.before} → After: {win.after}
                    </Text>
                  )}
                  {win.hoursSaved != null && (
                    <View style={styles.winBadge}>
                      <Text style={styles.winBadgeText}>{win.hoursSaved}h of manual work eliminated</Text>
                    </View>
                  )}
                  {win.shoutout && (
                    <Text style={styles.winShoutout}>Shoutout to {win.shoutout} for flagging this</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Arie Finance — Internal Operations Intelligence | Confidential
          </Text>
          <Text style={styles.footerText}>{today}</Text>
        </View>
      </Page>

      {/* ── Page 2 ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerBrand}>ARIE FINANCE</Text>
            <Text style={styles.headerSub}>Internal Operations Intelligence</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.headerSub, { color: 'rgba(255,255,255,0.45)', fontSize: 7 }]}>
              CONFIDENTIAL
            </Text>
          </View>
        </View>
        <View style={styles.goldBar} />

        <View style={styles.body}>
          {/* KPI Breakdown */}
          {(kpiNarrative || data.kpiBreakdown.length > 0) && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>KPI Breakdown</Text>
              {kpiNarrative ? (
                <Text style={styles.narrativeText}>{kpiNarrative}</Text>
              ) : (
                data.kpiBreakdown.map((k, i) => (
                  <View key={i} style={styles.kpiSection}>
                    <Text style={styles.kpiSectionName}>
                      {KPI_AREA_LABELS[k.kpi] ?? k.kpi}
                    </Text>
                    <Text style={styles.kpiSectionText}>{k.notes}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Top 3 Risks */}
          {data.topRisks.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>Risks &amp; Unresolved Items</Text>
              {riskNarrative ? (
                <Text style={styles.narrativeText}>{riskNarrative}</Text>
              ) : (
                data.topRisks.slice(0, 3).map((risk, i) => (
                  <View key={i} style={styles.riskItem}>
                    <Text style={styles.riskDesc}>
                      {risk.description.length > 120
                        ? risk.description.slice(0, 117) + '…'
                        : risk.description}
                    </Text>
                    <Text style={styles.riskMeta}>
                      {risk.department} · Open {risk.days_open ?? risk.daysOpen} days
                      {risk.urgency != null ? ` · Urgency ${risk.urgency}/10` : ''}
                    </Text>
                    {(risk.affectsClient || risk.involvesMoney) && (
                      <View style={styles.riskBadge}>
                        <Text style={styles.riskBadgeText}>
                          {[
                            risk.affectsClient ? 'Client-facing' : '',
                            risk.involvesMoney ? 'Financial risk' : '',
                          ].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {/* In Progress */}
          {data.inProgress.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>In Progress</Text>
              {data.inProgress.map((item, i) => (
                <View key={i} style={styles.inProgressItem}>
                  <View style={styles.inProgressDot} />
                  <Text style={styles.inProgressText}>
                    {item.title}
                    {item.toolUsed ? ` — ${item.toolUsed}` : ''}
                  </Text>
                  <Text style={styles.inProgressStatus}>
                    {item.status.replace('_', ' ')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Arie Finance — Internal Operations Intelligence | Confidential
          </Text>
          <Text style={styles.footerText}>{today}</Text>
        </View>
      </Page>
    </Document>
  )
}

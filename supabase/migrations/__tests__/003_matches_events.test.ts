import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("003_matches_events migration", () => {
  let sql: string;

  beforeAll(() => {
    sql = readFileSync(
      join(__dirname, "..", "003_matches_events.sql"),
      "utf-8"
    );
  });

  describe("matches table", () => {
    it("creates matches table with required columns", () => {
      expect(sql).toMatch(/CREATE TABLE public\.matches/i);
      expect(sql).toMatch(/id\s+uuid\s+PRIMARY KEY/i);
      expect(sql).toMatch(/tournament_id\s+uuid\s+NOT NULL/i);
      expect(sql).toMatch(/match_number\s+integer\s+NOT NULL/i);
      expect(sql).toMatch(/stage\s+text\s+NOT NULL/i);
      expect(sql).toMatch(/status\s+text\s+NOT NULL/i);
      expect(sql).toMatch(/home_score\s+integer/i);
      expect(sql).toMatch(/away_score\s+integer/i);
      expect(sql).toMatch(/scheduled_at\s+timestamptz/i);
    });

    it("has CHECK constraint on stage values", () => {
      expect(sql).toMatch(
        /CHECK\s*\(\s*stage\s+IN\s*\(\s*'group'\s*,\s*'quarterfinal'\s*,\s*'semifinal'\s*,\s*'final'\s*\)/i
      );
    });

    it("has CHECK constraint on status values", () => {
      expect(sql).toMatch(
        /CHECK\s*\(\s*status\s+IN\s*\(\s*'scheduled'\s*,\s*'live'\s*,\s*'completed'\s*,\s*'cancelled'\s*\)/i
      );
    });

    it("has UNIQUE constraint on tournament_id and match_number", () => {
      expect(sql).toMatch(/UNIQUE\s*\(\s*tournament_id\s*,\s*match_number\s*\)/i);
    });

    it("has nullable FKs for home_team_id and away_team_id", () => {
      // These columns should exist without NOT NULL (nullable for knockout placeholders)
      expect(sql).toMatch(/home_team_id\s+uuid/i);
      expect(sql).toMatch(/away_team_id\s+uuid/i);
      expect(sql).toMatch(/home_team_id.*REFERENCES.*teams\s*\(\s*id\s*\)/i);
      expect(sql).toMatch(/away_team_id.*REFERENCES.*teams\s*\(\s*id\s*\)/i);
    });

    it("has nullable FK for winner_team_id", () => {
      expect(sql).toMatch(/winner_team_id\s+uuid/i);
      expect(sql).toMatch(/winner_team_id.*REFERENCES.*teams\s*\(\s*id\s*\)/i);
    });

    it("has nullable penalty score columns", () => {
      expect(sql).toMatch(/home_penalty_score\s+integer/i);
      expect(sql).toMatch(/away_penalty_score\s+integer/i);
    });

    it("has ON DELETE CASCADE from tournament", () => {
      expect(sql).toMatch(
        /tournament_id\s+uuid\s+NOT NULL\s+REFERENCES\s+public\.tournaments\s*\(\s*id\s*\)\s+ON DELETE CASCADE/i
      );
    });

    it("has group_name column for group stage", () => {
      expect(sql).toMatch(/group_name\s+text/i);
    });

    it("enables RLS", () => {
      expect(sql).toMatch(
        /ALTER TABLE public\.matches ENABLE ROW LEVEL SECURITY/i
      );
    });
  });

  describe("match_events table", () => {
    it("creates match_events table with required columns", () => {
      expect(sql).toMatch(/CREATE TABLE public\.match_events/i);
      expect(sql).toMatch(/id\s+uuid\s+PRIMARY KEY/i);
      expect(sql).toMatch(/match_id\s+uuid\s+NOT NULL/i);
      expect(sql).toMatch(/event_type\s+text\s+NOT NULL/i);
      expect(sql).toMatch(/minute\s+integer\s+NOT NULL/i);
    });

    it("has CHECK constraint on event_type values", () => {
      expect(sql).toMatch(
        /CHECK\s*\(\s*event_type\s+IN\s*\(\s*'goal'\s*,\s*'yellow_card'\s*,\s*'red_card'\s*,\s*'substitution'\s*\)/i
      );
    });

    it("has FK to matches with ON DELETE CASCADE", () => {
      expect(sql).toMatch(
        /match_id\s+uuid\s+NOT NULL\s+REFERENCES\s+public\.matches\s*\(\s*id\s*\)\s+ON DELETE CASCADE/i
      );
    });

    it("has FK to teams for team_id", () => {
      expect(sql).toMatch(/team_id\s+uuid.*REFERENCES.*teams\s*\(\s*id\s*\)/i);
    });

    it("has FK to players for player_id", () => {
      expect(sql).toMatch(/player_id\s+uuid.*REFERENCES.*players\s*\(\s*id\s*\)/i);
    });

    it("has related_player_id for substitution events", () => {
      expect(sql).toMatch(/related_player_id\s+uuid/i);
      expect(sql).toMatch(/related_player_id.*REFERENCES.*players\s*\(\s*id\s*\)/i);
    });

    it("enables RLS", () => {
      expect(sql).toMatch(
        /ALTER TABLE public\.match_events ENABLE ROW LEVEL SECURITY/i
      );
    });
  });

  describe("announcements table", () => {
    it("creates announcements table with required columns", () => {
      expect(sql).toMatch(/CREATE TABLE public\.announcements/i);
      expect(sql).toMatch(/id\s+uuid\s+PRIMARY KEY/i);
      expect(sql).toMatch(/tournament_id\s+uuid\s+NOT NULL/i);
      expect(sql).toMatch(/title\s+text\s+NOT NULL/i);
      expect(sql).toMatch(/body\s+text\s+NOT NULL/i);
    });

    it("has tournament FK with ON DELETE CASCADE", () => {
      expect(sql).toMatch(
        /tournament_id\s+uuid\s+NOT NULL\s+REFERENCES\s+public\.tournaments\s*\(\s*id\s*\)\s+ON DELETE CASCADE/i
      );
    });

    it("has is_pinned column defaulting to false", () => {
      expect(sql).toMatch(/is_pinned\s+boolean\s+NOT NULL\s+DEFAULT\s+false/i);
    });

    it("has created_at timestamp", () => {
      expect(sql).toMatch(/created_at\s+timestamptz\s+NOT NULL\s+DEFAULT\s+now\(\)/i);
    });

    it("enables RLS", () => {
      expect(sql).toMatch(
        /ALTER TABLE public\.announcements ENABLE ROW LEVEL SECURITY/i
      );
    });
  });

  describe("updated_at triggers", () => {
    it("creates updated_at trigger for matches", () => {
      expect(sql).toMatch(/CREATE TRIGGER set_matches_updated_at/i);
    });
  });
});

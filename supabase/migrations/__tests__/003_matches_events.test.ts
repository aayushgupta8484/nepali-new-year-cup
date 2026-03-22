import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

let sql: string;

beforeAll(() => {
  sql = fs.readFileSync(
    path.resolve(__dirname, "../003_matches_events.sql"),
    "utf-8"
  );
});

describe("003_matches_events migration", () => {
  // =========================================================================
  // AC1: matches table
  // =========================================================================
  describe("matches table", () => {
    it("creates the matches table", () => {
      expect(sql).toMatch(/CREATE TABLE public\.matches\s*\(/);
    });

    it("has uuid primary key with default", () => {
      expect(sql).toMatch(
        /id\s+uuid\s+PRIMARY KEY\s+DEFAULT\s+gen_random_uuid\(\)/
      );
    });

    it("has tournament_id FK NOT NULL with ON DELETE CASCADE", () => {
      expect(sql).toMatch(
        /tournament_id\s+uuid\s+NOT NULL\s+REFERENCES\s+public\.tournaments\(id\)\s+ON DELETE CASCADE/
      );
    });

    it("has CHECK constraint on stage with all valid values including round_of_16 and third_place", () => {
      const stageValues = [
        "group",
        "round_of_16",
        "quarterfinal",
        "semifinal",
        "third_place",
        "final",
      ];
      for (const stage of stageValues) {
        expect(sql, `stage value '${stage}' missing from CHECK`).toContain(
          `'${stage}'`
        );
      }
      expect(sql).toMatch(/stage\s+text\s+NOT NULL\s*\n\s*CHECK\s*\(stage\s+IN/);
    });

    it("has CHECK constraint on status with all valid values", () => {
      const statusValues = ["scheduled", "live", "completed", "cancelled"];
      for (const status of statusValues) {
        expect(sql).toContain(`'${status}'`);
      }
      expect(sql).toMatch(
        /status\s+text\s+NOT NULL\s+DEFAULT\s+'scheduled'\s*\n\s*CHECK\s*\(status\s+IN/
      );
    });

    it("has UNIQUE constraint on (tournament_id, match_number)", () => {
      expect(sql).toMatch(/UNIQUE\s*\(\s*tournament_id\s*,\s*match_number\s*\)/);
    });

    it("has nullable home_team_id FK to teams", () => {
      const homeTeamLine = sql.match(/home_team_id\s+uuid\s+[^,\n]+/);
      expect(homeTeamLine).not.toBeNull();
      expect(homeTeamLine![0]).toMatch(/REFERENCES\s+public\.teams\(id\)/);
      expect(homeTeamLine![0]).not.toMatch(/NOT NULL/);
    });

    it("has nullable away_team_id FK to teams", () => {
      const awayTeamLine = sql.match(/away_team_id\s+uuid\s+[^,\n]+/);
      expect(awayTeamLine).not.toBeNull();
      expect(awayTeamLine![0]).toMatch(/REFERENCES\s+public\.teams\(id\)/);
      expect(awayTeamLine![0]).not.toMatch(/NOT NULL/);
    });

    it("has nullable winner_team_id FK to teams", () => {
      const winnerLine = sql.match(/winner_team_id\s+uuid\s+[^,\n]+/);
      expect(winnerLine).not.toBeNull();
      expect(winnerLine![0]).toMatch(/REFERENCES\s+public\.teams\(id\)/);
      expect(winnerLine![0]).not.toMatch(/NOT NULL/);
    });

    it("has nullable home_penalty_score and away_penalty_score", () => {
      const homePenalty = sql.match(/home_penalty_score\s+smallint[^,\n]*/);
      const awayPenalty = sql.match(/away_penalty_score\s+smallint[^,\n]*/);
      expect(homePenalty).not.toBeNull();
      expect(awayPenalty).not.toBeNull();
      expect(homePenalty![0]).not.toMatch(/NOT NULL/);
      expect(awayPenalty![0]).not.toMatch(/NOT NULL/);
    });

    it("has home_placeholder and away_placeholder text columns", () => {
      expect(sql).toMatch(/home_placeholder\s+text/);
      expect(sql).toMatch(/away_placeholder\s+text/);
    });

    it("has group_letter and round_number columns", () => {
      expect(sql).toMatch(/group_letter\s+char\(1\)/);
      expect(sql).toMatch(/round_number\s+smallint/);
    });

    it("has field_name text column", () => {
      expect(sql).toMatch(/field_name\s+text/);
    });

    it("has scheduled_at, started_at, ended_at timestamptz columns", () => {
      expect(sql).toMatch(/scheduled_at\s+timestamptz/);
      expect(sql).toMatch(/started_at\s+timestamptz/);
      expect(sql).toMatch(/ended_at\s+timestamptz/);
    });

    it("has created_at and updated_at with NOT NULL and defaults", () => {
      expect(sql).toMatch(/created_at\s+timestamptz\s+NOT NULL\s+DEFAULT\s+now\(\)/);
      expect(sql).toMatch(/updated_at\s+timestamptz\s+NOT NULL\s+DEFAULT\s+now\(\)/);
    });

    it("enables RLS", () => {
      expect(sql).toMatch(
        /ALTER TABLE public\.matches ENABLE ROW LEVEL SECURITY/
      );
    });

    it("has updated_at trigger", () => {
      expect(sql).toMatch(/CREATE TRIGGER set_matches_updated_at/);
      expect(sql).toMatch(
        /BEFORE UPDATE ON public\.matches[\s\S]*?EXECUTE FUNCTION public\.set_updated_at\(\)/
      );
    });
  });

  // =========================================================================
  // AC2: match_events table
  // =========================================================================
  describe("match_events table", () => {
    it("creates the match_events table", () => {
      expect(sql).toMatch(/CREATE TABLE public\.match_events\s*\(/);
    });

    it("has match_id FK NOT NULL with ON DELETE CASCADE", () => {
      expect(sql).toMatch(
        /match_id\s+uuid\s+NOT NULL\s+REFERENCES\s+public\.matches\(id\)\s+ON DELETE CASCADE/
      );
    });

    it("has team_id FK NOT NULL with ON DELETE CASCADE", () => {
      expect(sql).toMatch(
        /team_id\s+uuid\s+NOT NULL\s+REFERENCES\s+public\.teams\(id\)\s+ON DELETE CASCADE/
      );
    });

    it("has nullable player_id FK to players", () => {
      const playerLine = sql.match(/player_id\s+uuid\s+[^,\n]+/);
      expect(playerLine).not.toBeNull();
      expect(playerLine![0]).toMatch(/REFERENCES\s+public\.players\(id\)/);
      expect(playerLine![0]).not.toMatch(/NOT NULL/);
    });

    it("has CHECK constraint on event_type with all 7 valid values", () => {
      const eventTypes = [
        "goal",
        "own_goal",
        "penalty_goal",
        "penalty_miss",
        "yellow_card",
        "red_card",
        "substitution",
      ];
      for (const eventType of eventTypes) {
        expect(sql, `event_type '${eventType}' missing from CHECK`).toContain(
          `'${eventType}'`
        );
      }
      expect(sql).toMatch(
        /event_type\s+text\s+NOT NULL\s*\n\s*CHECK\s*\(event_type\s+IN/
      );
    });

    it("has nullable related_player_id FK to players", () => {
      const relatedLine = sql.match(/related_player_id\s+uuid\s+[^,\n]+/);
      expect(relatedLine).not.toBeNull();
      expect(relatedLine![0]).toMatch(/REFERENCES\s+public\.players\(id\)/);
      expect(relatedLine![0]).not.toMatch(/NOT NULL/);
    });

    it("has minute column", () => {
      expect(sql).toMatch(/minute\s+smallint/);
    });

    it("enables RLS", () => {
      expect(sql).toMatch(
        /ALTER TABLE public\.match_events ENABLE ROW LEVEL SECURITY/
      );
    });
  });

  // =========================================================================
  // AC3: announcements table
  // =========================================================================
  describe("announcements table", () => {
    it("creates the announcements table", () => {
      expect(sql).toMatch(/CREATE TABLE public\.announcements\s*\(/);
    });

    it("has tournament_id FK NOT NULL with ON DELETE CASCADE", () => {
      const announcementsSection = sql.substring(
        sql.indexOf("CREATE TABLE public.announcements")
      );
      expect(announcementsSection).toMatch(
        /tournament_id\s+uuid\s+NOT NULL\s+REFERENCES\s+public\.tournaments\(id\)\s+ON DELETE CASCADE/
      );
    });

    it("has title and body as NOT NULL text", () => {
      const announcementsSection = sql.substring(
        sql.indexOf("CREATE TABLE public.announcements")
      );
      expect(announcementsSection).toMatch(/title\s+text\s+NOT NULL/);
      expect(announcementsSection).toMatch(/body\s+text\s+NOT NULL/);
    });

    it("has is_pinned boolean NOT NULL with DEFAULT false", () => {
      expect(sql).toMatch(/is_pinned\s+boolean\s+NOT NULL\s+DEFAULT\s+false/);
    });

    it("enables RLS", () => {
      expect(sql).toMatch(
        /ALTER TABLE public\.announcements ENABLE ROW LEVEL SECURITY/
      );
    });
  });

  // =========================================================================
  // AC4: ON DELETE CASCADE from tournament for all tables
  // =========================================================================
  describe("cascade deletes from tournament", () => {
    it("matches cascades on tournament delete", () => {
      const matchesSection = sql.substring(
        sql.indexOf("CREATE TABLE public.matches"),
        sql.indexOf("CREATE TABLE public.match_events")
      );
      expect(matchesSection).toMatch(
        /tournament_id\s+uuid\s+NOT NULL\s+REFERENCES\s+public\.tournaments\(id\)\s+ON DELETE CASCADE/
      );
    });

    it("match_events cascade on match delete (transitive from tournament)", () => {
      const matchEventsSection = sql.substring(
        sql.indexOf("CREATE TABLE public.match_events"),
        sql.indexOf("CREATE TABLE public.announcements")
      );
      expect(matchEventsSection).toMatch(
        /match_id\s+uuid\s+NOT NULL\s+REFERENCES\s+public\.matches\(id\)\s+ON DELETE CASCADE/
      );
    });

    it("announcements cascade on tournament delete", () => {
      const announcementsSection = sql.substring(
        sql.indexOf("CREATE TABLE public.announcements")
      );
      expect(announcementsSection).toMatch(
        /tournament_id\s+uuid\s+NOT NULL\s+REFERENCES\s+public\.tournaments\(id\)\s+ON DELETE CASCADE/
      );
    });
  });

  // =========================================================================
  // Indexes
  // =========================================================================
  describe("indexes", () => {
    it("has index on matches(tournament_id, status)", () => {
      expect(sql).toMatch(
        /CREATE INDEX\s+idx_matches_tournament_status\s+ON\s+public\.matches\s*\(\s*tournament_id\s*,\s*status\s*\)/
      );
    });

    it("has index on matches(tournament_id, stage, group_letter)", () => {
      expect(sql).toMatch(
        /CREATE INDEX\s+idx_matches_tournament_stage_group\s+ON\s+public\.matches/
      );
    });

    it("has indexes on home_team_id and away_team_id", () => {
      expect(sql).toMatch(/CREATE INDEX\s+idx_matches_home_team/);
      expect(sql).toMatch(/CREATE INDEX\s+idx_matches_away_team/);
    });

    it("has index on match_events(match_id)", () => {
      expect(sql).toMatch(
        /CREATE INDEX\s+idx_match_events_match\s+ON\s+public\.match_events\s*\(\s*match_id\s*\)/
      );
    });

    it("has index on match_events(player_id, event_type)", () => {
      expect(sql).toMatch(
        /CREATE INDEX\s+idx_match_events_player\s+ON\s+public\.match_events\s*\(\s*player_id\s*,\s*event_type\s*\)/
      );
    });
  });
});

/*
 * Copyright 2026 The Vanilla Conquer Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

#include "td_difficulty.h"

namespace cnc {
namespace web {

namespace {

void SetDifficulty(CNCDifficultyDataStruct& output,
                   float firepower,
                   float ground_speed,
                   float air_speed,
                   float armor,
                   float rate_of_fire,
                   float cost,
                   float build_speed,
                   float repair_delay,
                   float build_delay,
                   bool build_slowdown)
{
    output.FirepowerBias = firepower;
    output.GroundspeedBias = ground_speed;
    output.AirspeedBias = air_speed;
    output.ArmorBias = armor;
    output.ROFBias = rate_of_fire;
    output.CostBias = cost;
    output.BuildSpeedBias = build_speed;
    output.RepairDelay = repair_delay;
    output.BuildDelay = build_delay;
    output.IsBuildSlowdown = build_slowdown;
    output.IsWallDestroyer = true;
    output.IsContentScan = true;
}

} // namespace

CNCRulesDataStruct ClassicDifficultyRules()
{
    CNCRulesDataStruct rules = {};
    SetDifficulty(rules.Difficulties[0], 1.1f, 1.1f, 1.1f, 1.0f, 0.8f, 0.8f, 0.6f, 0.001f, 0.002f, false);
    SetDifficulty(rules.Difficulties[1], 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 0.02f, 0.03f, true);
    SetDifficulty(rules.Difficulties[2], 0.9f, 0.9f, 0.9f, 1.05f, 1.05f, 1.0f, 1.0f, 0.05f, 0.1f, true);
    return rules;
}

} // namespace web
} // namespace cnc

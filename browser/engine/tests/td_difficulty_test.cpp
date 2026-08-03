/*
 * Copyright 2026 The Vanilla Conquer Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

#include "td_difficulty.h"

#include <assert.h>
#include <math.h>

namespace {

bool Near(float left, float right)
{
    return fabs(left - right) < 0.00001f;
}

void AssertDifficulty(const CNCDifficultyDataStruct& actual,
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
    assert(Near(actual.FirepowerBias, firepower));
    assert(Near(actual.GroundspeedBias, ground_speed));
    assert(Near(actual.AirspeedBias, air_speed));
    assert(Near(actual.ArmorBias, armor));
    assert(Near(actual.ROFBias, rate_of_fire));
    assert(Near(actual.CostBias, cost));
    assert(Near(actual.BuildSpeedBias, build_speed));
    assert(Near(actual.RepairDelay, repair_delay));
    assert(Near(actual.BuildDelay, build_delay));
    assert(actual.IsBuildSlowdown == build_slowdown);
    assert(actual.IsWallDestroyer);
    assert(actual.IsContentScan);
}

} // namespace

int main()
{
    const CNCRulesDataStruct rules = cnc::web::ClassicDifficultyRules();
    const CNCDifficultyDataStruct& easy = rules.Difficulties[0];
    const CNCDifficultyDataStruct& normal = rules.Difficulties[1];
    const CNCDifficultyDataStruct& hard = rules.Difficulties[2];

    AssertDifficulty(easy, 1.1f, 1.1f, 1.1f, 1.0f, 0.8f, 0.8f, 0.6f, 0.001f, 0.002f, false);
    AssertDifficulty(normal, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 0.02f, 0.03f, true);
    AssertDifficulty(hard, 0.9f, 0.9f, 0.9f, 1.05f, 1.05f, 1.0f, 1.0f, 0.05f, 0.1f, true);

    assert(easy.FirepowerBias > normal.FirepowerBias);
    assert(normal.FirepowerBias > hard.FirepowerBias);
    assert(easy.CostBias < normal.CostBias);
    return 0;
}

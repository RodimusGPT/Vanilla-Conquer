/*
 * Copyright 2026 The Vanilla Conquer Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

#ifndef CNC_WEB_TD_DIFFICULTY_H
#define CNC_WEB_TD_DIFFICULTY_H

#include "common/wwstd.h"
#if !defined(_MSC_VER) && !defined(__int64)
#define CNC_WEB_UNDEFINE_INT64
#define __int64 long long
#endif
#include "tiberiandawn/dllinterface.h"
#ifdef CNC_WEB_UNDEFINE_INT64
#undef __int64
#undef CNC_WEB_UNDEFINE_INT64
#endif

namespace cnc {
namespace web {

/*
 * REMASTER_BUILD expects its host to provide the difficulty rule table through
 * CNC_Config. The browser is that host, so use the same three profiles as the
 * classic standalone build before starting a scenario.
 */
CNCRulesDataStruct ClassicDifficultyRules();

} // namespace web
} // namespace cnc

#endif /* CNC_WEB_TD_DIFFICULTY_H */

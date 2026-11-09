/* QA data only; never imported by production source. */
const f = require('./simulation-card02-fixtures.cjs');
function item(score = null, chapterId = 1, number = 1) {
  return {...f.item(score, chapterId, number), isBookmarked: true,
    isPracticed: score !== null, completedAttemptCount: score === null ? 0 : 2};
}
function list(params = {page: 0}, total = 3) {
  const chapterId = params.chapterId ?? null;
  const filteredCount = chapterId && chapterId !== 1 ? 0 : total;
  return {scope: {...f.scope}, scoringVersion: 'qa-score', datasetVersion: f.dataset,
    totalBookmarked: total,
    chapters: f.chapters().map((c, i) => {const {needReviewCount, ...rest} = c; return {...rest, bookmarkedCount: i === 0 ? total : 0};}),
    chapterId, sort: 'SCENARIO_ASC', filteredCount,
    items: Array.from({length: filteredCount}, (_, i) => item([null, 0, 5][i % 3], 1, i + 1)).slice(params.page * 12, params.page * 12 + 12),
    page: {number: params.page, size: 12, totalElements: filteredCount, totalPages: Math.ceil(filteredCount / 12)}};
}
function overview(total = 3) {const {items, page, chapterId, sort, filteredCount, ...value} = list({page: 0}, total); return value;}
module.exports = {...f, item, list, overview};

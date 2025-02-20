import setHighlightClass from 'ee_else_ce/search/highlight_blob_search_result';
import { queryToObject } from '~/lib/utils/url_utility';
import syntaxHighlight from '~/syntax_highlight';
import { initSidebar, sidebarInitState } from './sidebar';
import { initSearchSort } from './sort';
import createStore from './store';
import { initTopbar } from './topbar';
import { initBlobRefSwitcher } from './under_topbar';

const topbarInitState = () => {
  const el = document.getElementById('js-search-topbar');
  if (!el) return {};
  const { defaultBranchName } = el.dataset;
  return { defaultBranchName };
};

export const initSearchApp = () => {
  syntaxHighlight(document.querySelectorAll('.js-search-results'));
  const query = queryToObject(window.location.search, { gatherArrays: true });
  const { navigationJsonParsed: navigation, searchType } = sidebarInitState() || {};
  const { defaultBranchName } = topbarInitState() || {};

  const store = createStore({
    query,
    navigation,
    searchType,
    defaultBranchName,
  });

  initTopbar(store);
  initSidebar(store);
  initSearchSort(store);

  setHighlightClass(query.search); // Code Highlighting
  initBlobRefSwitcher(); // Code Search Branch Picker
};

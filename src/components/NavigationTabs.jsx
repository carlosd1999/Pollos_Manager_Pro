import { MAIN_TABS, TAB_LABELS } from '../constants/app';
import ChickenLogo from './ChickenLogo';
import { TabIcon } from './NavIcons';

function NavigationTabs({ tab, setTab, className = 'top-tabs', visibleTabs = MAIN_TABS }) {
  const isMobile = className.includes('bottom-nav');
  const tabs = visibleTabs?.length ? visibleTabs : MAIN_TABS;

  const brandMark = (
    <div className="nav-bar-chicken" aria-hidden="true">
      <ChickenLogo variant="nav" size={isMobile ? 26 : 30} />
    </div>
  );

  if (isMobile) {
    return (
      <nav className={`${className} nav-bar-mobile`} aria-label="Secciones">
        <div className="nav-bar-mobile-inner">
          {brandMark}
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              className={`nav-bar-mobile-item ${tab === item ? 'active' : ''}`}
              onClick={() => setTab(item)}
            >
              <span className="nav-bar-mobile-icon">
                <TabIcon tab={item} />
              </span>
              <span className="nav-bar-mobile-label">{TAB_LABELS[item]}</span>
            </button>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className={`${className} nav-bar-desktop`} aria-label="Secciones">
      <div className="nav-bar-desktop-inner">
        {brandMark}
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            className={`nav-bar-desktop-link ${tab === item ? 'active' : ''}`}
            onClick={() => setTab(item)}
          >
            {TAB_LABELS[item]}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default NavigationTabs;

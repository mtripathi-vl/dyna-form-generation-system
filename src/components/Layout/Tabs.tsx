import React, { useState } from 'react';
import styles from './Tabs.module.css';

interface TabGroup {
    title: string;
    content: React.ReactNode;
}

interface TabsProps {
    groups: TabGroup[];
}

const Tabs: React.FC<TabsProps> = ({ groups = [] }) => {
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    // Ensure activeTabIndex is valid if groups change
    const currentActiveIndex = Math.min(activeTabIndex, Math.max(0, groups.length - 1));

    return (
        <div>
            <div className={styles.tabHeaderContainer}>
                {groups.map((group, index) => (
                    <button
                        key={group.title}
                        type="button" // Prevent form submission if inside a form
                        className={`${styles.tabButton} ${index === currentActiveIndex ? styles.tabButtonActive : ''}`}
                        onClick={() => setActiveTabIndex(index)}
                        aria-selected={index === currentActiveIndex}
                        role="tab"
                    >
                        {group.title}
                    </button>
                ))}
            </div>
            <div className={styles.tabContent} role="tabpanel">
                {/* Render content of the active tab */}
                {groups[currentActiveIndex]?.content}
            </div>
        </div>
    );
};

export default Tabs;

import { FunctionComponent } from 'react';
import styles from './NewsCard.module.css';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface NewsCardProps {
  badge: string;
  value: string;
  subtitle: string;
  title: string;
  icon?: 'calendar' | 'dollar' | 'trending';
}

const NewsCard: FunctionComponent<NewsCardProps> = ({ badge, value, subtitle, title, icon = 'calendar' }) => {
  const IconComponent = icon === 'dollar' ? DollarSign : icon === 'trending' ? TrendingUp : Calendar;

  return (
    <div className={styles.newsCard}>
      <div className={styles.datePublishedHeadline}>
        <div className={styles.feb82025}>{subtitle}</div>
        <div className={styles.spotBitcoinEtfs}>{title}</div>
      </div>
      <div className={styles.illustration}>
        <div className={styles.illustrationChild} />
        <div className={styles.valueText}>{value}</div>
        <div className={styles.badge}>
          <IconComponent className={styles.iconCalendar} />
          <div className={styles.todaysNews}>{badge}</div>
        </div>
        <div className={styles.lineDiv} />
      </div>
    </div>
  );
};

export default NewsCard;

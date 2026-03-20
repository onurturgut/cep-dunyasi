import styles from './stacked-cards.module.css';

const cards = [
  { id: 'kampanya-1', title: 'Kampanya 1' },
  { id: 'kampanya-2', title: 'Kampanya 2' },
  { id: 'kampanya-3', title: 'Kampanya 3' },
  { id: 'kampanya-4', title: 'Kampanya 4' },
];

export default function StackedCardsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.stack} aria-label="Stacked cards">
        {cards.map((card, index) => (
          <article key={card.id} className={styles.card} data-index={index} style={{ zIndex: cards.length - index }}>
            <h2 className={styles.title}>{card.title}</h2>
          </article>
        ))}
      </div>
    </main>
  );
}

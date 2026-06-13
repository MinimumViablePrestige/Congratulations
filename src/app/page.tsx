import Link from "next/link";
import styles from "./page.module.css";

const highlights = [
  {
    title: "Собрать без хаоса",
    text: "Один человек создает ссылку, остальные добавляют поздравления без бесконечных сообщений в чате."
  },
  {
    title: "Помочь с текстом",
    text: "AI-помощник подскажет теплый и уместный текст, если участник не знает, что написать."
  },
  {
    title: "Подарить красиво",
    text: "Получатель открывает не просто страницу, а аккуратно собранную цифровую открытку с эффектом вручения."
  }
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>MVP групповой открытки</p>
          <h1 className={styles.title}>Соберите теплое поздравление от всей группы за несколько минут</h1>
          <p className={styles.subtitle}>
            Начинаем с трех сценариев: для учителя, воспитателя и коллеги. Дальше будем усиливать
            финальный вау-эффект, AI-помощника и оплату публикации.
          </p>
          <div className={styles.actions}>
            <Link href="/create" className={styles.primaryAction}>
              Создать открытку
            </Link>
            <Link href="/roadmap" className={styles.secondaryAction}>
              Посмотреть этапы
            </Link>
          </div>
        </section>

        <section className={styles.grid} aria-label="Ценность продукта">
          {highlights.map((item) => (
            <article key={item.title} className={styles.card}>
              <h2 className={styles.cardTitle}>{item.title}</h2>
              <p className={styles.cardText}>{item.text}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

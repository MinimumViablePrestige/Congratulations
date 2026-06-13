type HeroCardProps = {
  title: string;
  text: string;
};

export const HeroCard = ({ title, text }: HeroCardProps) => {
  return (
    <article>
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  );
};

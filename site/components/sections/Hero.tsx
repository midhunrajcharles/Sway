import { HeroLiquid } from "@/components/HeroLiquid";
import { Words } from "@/components/kit";
import { WipeButton } from "@/components/WipeButton";

/** Hero: liquid chrome pipes and the headline. */
export default function Hero() {
  return (
    <section className="section-shell-module__wD-FXq__root">
      <div className="container-module__fR7GYG__root container-module__fR7GYG__full section-shell-module__wD-FXq__inner section-shell-module__wD-FXq__full hero-module__kIxoYa__root">
        <HeroLiquid shadeFloor={0.6} />
        <h1 className="text-module__DYGPWq__root text-module__DYGPWq__display-fluid text-module__DYGPWq__weight-medium hero-module__kIxoYa__title">
          <Words text="They check what. We check why." />
        </h1>
        <WipeButton className="hero-module__kIxoYa__cta" href="#capabilities">
          See how Sway works
        </WipeButton>
      </div>
    </section>
  );
}

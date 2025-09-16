import { HelmetProvider, Helmet } from "react-helmet-async";

const PageMeta = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
  </Helmet>
);

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <Helmet>
      <title>Feedstream</title>
      <meta name="description" content="Feedstream - Your solution" />
    </Helmet>
    {children}
  </HelmetProvider>
);

export default PageMeta;
